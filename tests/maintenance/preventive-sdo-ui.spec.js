import { test, expect } from "@playwright/test";
const company = "12000000-0000-4000-8000-000000000001",
  vehicleId = "33000000-0000-4000-8000-000000000001",
  partnerId = "43000000-0000-4000-8000-000000000001";
async function boot(page, { km = 123456, role = "admin_geral", preventivePlans = [] } = {}) {
  const user = {
    id: "22000000-0000-4000-8000-000000000001",
    email: "preventive@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    user_metadata: { full_name: "Usuário teste" },
    app_metadata: { provider: "email" },
  };
  await page.addInitScript(
    ({ user }) => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token =
        btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) +
        "." +
        btoa(
          JSON.stringify({
            sub: user.id,
            role: "authenticated",
            aud: "authenticated",
            exp,
          }),
        ) +
        ".signature";
      localStorage.setItem(
        "sb-maintenance-fixture-auth-token",
        JSON.stringify({
          access_token: token,
          refresh_token: "fixture",
          expires_at: exp,
          expires_in: 3600,
          token_type: "bearer",
          user,
        }),
      );
      localStorage.setItem(
        "ambipar_preventive_maintenance_v1",
        JSON.stringify([{ placa: "FAL0000", odometro_atual: 999 }]),
      );
    },
    { user },
  );
  const vehicle = {
    id: vehicleId,
    company_id: company,
    placa: "ABC1D23",
    marca_modelo: "Volvo FH",
    tipo: "caminhao",
    status: "Disponível",
    km_atual: km,
  };
  const calls = [];
  let order = null;
  const savedPlans = preventivePlans.map((plan, index) => ({
    id: plan.id || `plan-${index}`,
    company_id: company,
    vehicle_id: vehicleId,
    categoria_veiculo: "caminhao",
    ativo: true,
    ...plan,
  }));
  await page.route(
    "https://maintenance-fixture.supabase.co/**",
    async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        table = url.pathname.split("/").pop();
      let data = [];
      if (url.pathname.includes("/auth/")) data = user;
      else if (table === "company_members")
        data = [
          {
            company_id: company,
            role: "administrador",
            maintenance_role: role,
            full_module_access: false,
          },
        ];
      else if (table === "companies")
        data = [{ id: company, nome: "Empresa de teste" }];
      else if (table === "veiculos") {
        if (request.method() !== "GET")
          {calls.push({ table, method: request.method() });Object.assign(vehicle,request.postDataJSON());}
        data = request.method()==='PATCH'?vehicle:[vehicle];
      } else if (table === "maintenance_partners")
        data = [
          {
            id: partnerId,
            company_id: company,
            nome_fantasia: "Oficina teste",
            razao_social: "Oficina teste",
            status: "ativo",
            onboarding_profile: {},
            deleted_at: null,
          },
        ];
      else if (table === "maintenance_settings")
        data = { limite_aprovacao_supervisor: 5000 };
      else if (table === "maintenance_plan_command") {
        const b = request.postDataJSON();
        calls.push(b);
        if (b.command === "save") {
          const plan = { id: `plan-${savedPlans.length}`, company_id: company, ...b.body };
          savedPlans.push(plan);
          data = plan;
        } else if (b.command === "context") {
          data = {
            plans: savedPlans,
            vehicles: [vehicle],
            settings: { antecedencia_alerta_dias: 7, antecedencia_alerta_km: 500, version: 1 },
          };
        } else if (b.command === "count") {
          data = { count: 0 };
        } else {
          data = {
            rows: savedPlans
              .filter((plan) => !b.body?.vehicle_id || plan.vehicle_id === b.body.vehicle_id)
              .map((plan, index) => {
                const next = Number(plan.ultima_execucao_km) + Number(plan.intervalo_km || 0);
                const left = next - Number(vehicle.km_atual || 0);
                return {
                  id: `plan-vehicle-${index}`,
                  plan_id: plan.id,
                  vehicle_id: plan.vehicle_id || vehicleId,
                  nome: plan.nome,
                  km_atual: vehicle.km_atual,
                  ultima_execucao_km: Number(plan.ultima_execucao_km),
                  ultima_execucao_data: plan.ultima_execucao_data,
                  proxima_km: next,
                  proxima_data: null,
                  estado: left <= 0 ? "vencida" : left <= 500 ? "breve" : "dia",
                };
              }),
          };
        }
      } else if (table === "maintenance_vehicle_command")
        data = { preferences: {} };
      else if (table === "maintenance_order_command") {
        const b = request.postDataJSON();
        calls.push(b);
        order = {
          id: "53000000-0000-4000-8000-000000000001",
          company_id: company,
          numero: "OS-2026-0001",
          status: "aberta",
          orcamento_status: "pendente",
          valor_pecas: 0,
          valor_mao_obra: 0,
          valor_total: 0,
          version: 1,
          created_at: new Date().toISOString(),
          data_abertura: new Date().toISOString(),
          ...b.body,
        };
        data = order;
      } else if (table === "maintenance_orders")
        data = url.searchParams.has("id") ? order : order ? [order] : [];
      const single = (request.headers()["accept"] || "").includes(
        "vnd.pgrst.object",
      );
      if (single && Array.isArray(data)) data = data[0] || null;
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "application/json",
          "content-range": order ? "0-0/1" : "*/0",
        },
        body: JSON.stringify(data),
      });
    },
  );
  return { calls, vehicle, getOrder: () => order };
}
test("preventiva gera solicitação persistida com serviços, adicionais e urgência sem baixar ou zerar KM", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const f = await boot(page, {
    preventivePlans: [
      { nome: "Troca de Óleo de Motor & Filtros", intervalo_km: 15000, ultima_execucao_km: 110000, ultima_execucao_data: "2026-01-01" },
      { nome: "Engraxamento & Lubrificação de Articulações", intervalo_km: 15000, ultima_execucao_km: 110000, ultima_execucao_data: "2026-01-01" },
      { nome: "Revisão de Freios", intervalo_km: 15000, ultima_execucao_km: 110000, ultima_execucao_data: "2026-01-01" },
      { nome: "Separador de Água", intervalo_km: 15000, ultima_execucao_km: 110000, ultima_execucao_data: "2026-01-01" },
    ],
  });
  await page.goto("/manutencao-preventiva");
  const module = page.locator(".pm-page");
  await expect(
    module.getByRole("heading", { name: "ABC1D23", exact: true }),
  ).toBeVisible();
  await expect(module.getByText("123.456 km", { exact: true })).toBeVisible();
  await expect(module.getByText("FAL0000")).toHaveCount(0);
  await expect(
    module.getByRole("button", { name: /Baixar Preventiva/ }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/preventive-sdo-desktop.png",
    fullPage: true,
  });
  await module.getByRole("link", { name: "Gerar S.D.O preventiva" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Nova S.D.O — Solicitação de Orçamento Preventivo",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("KM atual *")).toHaveValue("123456");
  const description = page.getByLabel("Serviços preventivos e adicionais *");
  const original = await description.inputValue();
  for (const text of [
    "Troca de Óleo",
    "Engraxamento",
    "Revisão de Freios",
    "Separador de Água",
  ])
    expect(original).toContain(text);
  await description.fill(original + "\nVerificar vazamento no radiador.");
  await page.getByLabel("Grau de urgência").selectOption("critica");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(description).toHaveValue(
    original + "\nVerificar vazamento no radiador.",
  );
  await expect(page.getByLabel("Grau de urgência")).toHaveValue("critica");
  await page.getByLabel("Oficina", { exact: true }).selectOption(partnerId);
  await page.getByRole("button", { name: "Gerar S.D.O", exact: true }).click();
  await expect.poll(() => f.getOrder()?.prioridade).toBe("critica");
  expect(f.getOrder().descricao_problema).toContain(
    "Verificar vazamento no radiador.",
  );
  await expect(
    page.getByRole("heading", { name: /OS-2026-0001/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(f.getOrder().km_abertura).toBe(123456);
  expect(f.vehicle.km_atual).toBe(123456);
  expect(
    f.calls.filter(
      (c) => c.table === "veiculos" || c.command === "create_order",
    ),
  ).toEqual([]);
  await page.goto("/manutencao-preventiva");
  await expect(
    page.getByRole("cell", { name: "OS-2026-0001", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".pm-page").getByText("123.456 km", { exact: true }),
  ).toBeVisible();
});
test("KM desconhecido exige informação real e permite modo claro em celular", async ({
  page,
}) => {
  await boot(page, { km: null });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/manutencao-preventiva");
  await expect(
    page.getByText("KM não informado", { exact: true }),
  ).toBeVisible();
  await expect.poll(()=>page.locator('.app-sidebar').evaluate(el=>el.getBoundingClientRect().width)).toBeLessThan(90);expect((await page.locator('.pm-page').boundingBox()).width).toBeGreaterThan(250);await page.getByRole("button", { name: "Modo claro", exact: true }).click();
  await expect(page.locator(".pm-page")).toHaveAttribute(
    "data-pm-theme",
    "light",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/preventive-sdo-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Gerar S.D.O preventiva" }).click();
  await expect(page.getByLabel("KM atual *")).toHaveValue("");
  await page.getByRole("button", { name: "Gerar S.D.O", exact: true }).click();
  await expect(
    page
      .getByText(/Informe KM|Informe o KM|Informe um KM|KM atual deve/)
      .first(),
  ).toBeVisible();
});

test('KM e referência persistem e recalculam barras, próximo KM e alerta', async ({ page }) => {
  const f = await boot(page, { km: 140000 });
  await page.goto('/manutencao/planos-preventivos');
  await page.getByRole('button', { name: 'Novo plano', exact: true }).click();
  await page.getByLabel('Veículo *', { exact: true }).selectOption(vehicleId);
  await page.getByLabel('Item *').fill('Troca de Óleo de Motor & Filtros');
  await page.getByLabel('Intervalo em KM', { exact: true }).fill('15000');
  await page.getByLabel('KM da última execução / base *', { exact: true }).fill('130000');
  await page.getByLabel('Data da última execução / base *', { exact: true }).fill('2026-01-01');
  await page.getByRole('button', { name: 'Salvar plano', exact: true }).click();
  await expect(page.getByText('Plano salvo com auditoria.')).toBeVisible();

  await page.goto('/manutencao-preventiva');
  const progress = page.getByRole('progressbar', { name: 'Troca de Óleo de Motor & Filtros — ABC1D23', exact: true });
  await expect(progress).toHaveAttribute('aria-valuenow', '67');
  await expect(page.getByText('Próxima: 145.000 km', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar KM', exact: true }).click();
  const kmDialog = page.getByRole('dialog', { name: 'Atualizar odômetro · ABC1D23' });
  await kmDialog.getByLabel('KM atual do veículo', { exact: true }).fill('144600');
  await kmDialog.getByRole('button', { name: 'Salvar KM', exact: true }).click();
  await expect(kmDialog).toHaveCount(0);
  await expect(progress).toHaveAttribute('aria-valuenow', '97');
  await expect(page.getByText('400 km restantes', { exact: true })).toBeVisible();
  await expect(page.locator('.pm-progress-item.breve')).toContainText('Vence em breve');
  expect(f.vehicle.km_atual).toBe(144600);
  await page.reload();
  await expect(progress).toHaveAttribute('aria-valuenow', '97');
  await page.screenshot({ path: 'test-results/preventive-progress-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Atualizar KM', exact: true }).click();
  await page.getByRole('dialog').getByLabel('KM atual do veículo', { exact: true }).fill('145100');
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar KM', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('.pm-progress-item.vencida')).toContainText('Vencida');
  await expect(page.getByText('100 km em atraso', { exact: true })).toBeVisible();
});

test('sem plano cadastrado, a solicitação pede os serviços reais e não inventa manutenções', async ({ page }) => {
  await boot(page, { km: 200000 });
  await page.goto('/manutencao-preventiva');
  await expect(page.getByText('Nenhum plano preventivo cadastrado para este veículo.')).toBeVisible();
  await page.getByRole('link', { name: 'Gerar S.D.O preventiva' }).click();
  const description = page.getByLabel('Serviços preventivos e adicionais *');
  await expect(description).toHaveValue(/Não há plano preventivo cadastrado/);
  await expect(description).not.toHaveValue(/Troca de Óleo|Engraxamento|Revisão de Freios/);
});
