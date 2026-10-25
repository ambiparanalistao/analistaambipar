import { test, expect } from "@playwright/test";
const company = "12000000-0000-4000-8000-000000000001",
  vehicleId = "33000000-0000-4000-8000-000000000001",
  partnerId = "43000000-0000-4000-8000-000000000001";
async function boot(page, { km = 123456, role = "admin_geral" } = {}) {
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
          calls.push({ table, method: request.method() });
        data = [vehicle];
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
        data = { rows: [] };
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
  const f = await boot(page);
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
  await module.getByRole("link", { name: "Gerar SDO preventiva" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Nova SDO — Solicitação de Orçamento Preventivo",
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
  await page.getByRole("button", { name: "Gerar SDO", exact: true }).click();
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
  await page.getByRole("link", { name: "Gerar SDO preventiva" }).click();
  await expect(page.getByLabel("KM atual *")).toHaveValue("");
  await page.getByRole("button", { name: "Gerar SDO", exact: true }).click();
  await expect(
    page
      .getByText(/Informe KM|Informe o KM|Informe um KM|KM atual deve/)
      .first(),
  ).toBeVisible();
});
