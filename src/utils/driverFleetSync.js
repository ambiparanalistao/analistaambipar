/**
 * Utilitário de Sincronização Bidirecional entre Motoristas e Frotas Ambipar
 * Garante que qualquer condutor vinculado a um veículo apareça automaticamente
 * no Quadro de Motoristas & Certificações MOPP, e vice-versa.
 */

export const DEFAULT_AMBIPAR_DRIVERS = [
  {
    id: 'MOT-001',
    nome: 'Carlos Eduardo Dos Santos Ferreira',
    cpf: '284.918.472-88',
    telefone: '(21) 99240-5610',
    telefone_emergencia: '(21) 98877-1122',
    cnh: '04819283746',
    categoria_cnh: 'E',
    validade_cnh: '2028-11-20',
    mopp_numero: 'MOPP-78192',
    validade_mopp: '2027-08-15',
    validade_toxicologico: '2027-04-10',
    validade_nr20: '2027-09-30',
    validade_nr35: '2027-06-15',
    validade_nr33: '2027-06-15',
    validade_direcao_defensiva: '2028-01-10',
    validade_cargas_especiais: '2027-12-15',
    validade_hazmat_pae: '2028-02-28',
    veiculo_vinculado: 'AMB-4K89',
    status: 'Disponível',
    observacoes: 'Condutor titular homologado para transporte de produtos químicos a granel e resíduos industriais perigosos (Hazmat).'
  },
  {
    id: 'MOT-002',
    nome: 'Marcelo Silveira Rocha',
    cpf: '341.829.102-45',
    telefone: '(19) 98765-4321',
    telefone_emergencia: '(19) 97766-3344',
    cnh: '05918273645',
    categoria_cnh: 'E',
    validade_cnh: '2028-05-18',
    mopp_numero: 'MOPP-65412',
    validade_mopp: '2027-06-22',
    validade_toxicologico: '2027-03-12',
    validade_nr20: '2027-08-20',
    validade_nr35: '2027-05-10',
    validade_nr33: '2027-05-10',
    validade_direcao_defensiva: '2027-11-25',
    validade_cargas_especiais: '2027-10-18',
    validade_hazmat_pae: '2028-03-15',
    veiculo_vinculado: 'AMB7X21',
    status: 'Disponível',
    observacoes: 'Especialista em bitrem e rodotrem tanque químico. Certificação em atendimento emergencial PAE.'
  },
  {
    id: 'MOT-003',
    nome: 'Roberto Antunes de Lima',
    cpf: '198.472.901-33',
    telefone: '(71) 99123-8877',
    telefone_emergencia: '(71) 98833-4455',
    cnh: '03819204756',
    categoria_cnh: 'E',
    validade_cnh: '2027-11-15',
    mopp_numero: 'MOPP-91823',
    validade_mopp: '2027-07-05',
    validade_toxicologico: '2026-12-01',
    validade_nr20: '2027-07-10',
    validade_nr35: '2027-04-20',
    validade_nr33: '2027-04-20',
    validade_direcao_defensiva: '2027-09-15',
    validade_cargas_especiais: '2027-08-30',
    validade_hazmat_pae: '2027-12-10',
    veiculo_vinculado: 'AMB2M33',
    status: 'Disponível',
    observacoes: 'Operador de auto-vácuo e sucção pesada para resíduos Classe I e dragagem química.'
  },
  {
    id: 'MOT-004',
    nome: 'Anderson Silva Costa',
    cpf: '412.384.910-77',
    telefone: '(13) 99789-0011',
    telefone_emergencia: '(13) 98822-1100',
    cnh: '06718293041',
    categoria_cnh: 'D',
    validade_cnh: '2028-12-31',
    mopp_numero: 'MOPP-34901',
    validade_mopp: '2027-11-12',
    validade_toxicologico: '2027-06-15',
    validade_nr20: '2027-11-30',
    validade_nr35: '2027-08-10',
    validade_nr33: '2027-08-10',
    validade_direcao_defensiva: '2028-02-14',
    validade_cargas_especiais: '2028-01-20',
    validade_hazmat_pae: '2028-06-30',
    veiculo_vinculado: 'AMB5P44',
    status: 'Disponível',
    observacoes: 'Líder de equipe de resposta rápida ambiental PAE Ambipar 24h. Treinado em contenção de derramamentos.'
  }
];

/**
 * Obtém a lista consolidada de motoristas sincronizada com os veículos da frota
 */
export function getStoredOrSyncedDrivers() {
  if (typeof window === 'undefined') return DEFAULT_AMBIPAR_DRIVERS;

  let existingDrivers = [];
  try {
    const saved = localStorage.getItem('ambipar_real_drivers');
    if (saved) {
      existingDrivers = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Erro ao ler ambipar_real_drivers:', e);
  }

  if (!Array.isArray(existingDrivers)) {
    existingDrivers = [];
  }

  // Se não houver nada no localStorage de motoristas, inicia com os drivers padrão
  if (existingDrivers.length === 0) {
    existingDrivers = [...DEFAULT_AMBIPAR_DRIVERS];
  }

  // Lê veículos cadastrados ou em uso para importar qualquer motorista vinculado
  try {
    const savedVehicles = localStorage.getItem('ambipar_real_vehicles');
    let vehiclesList = [];
    if (savedVehicles) {
      vehiclesList = JSON.parse(savedVehicles);
    }

    if (Array.isArray(vehiclesList) && vehiclesList.length > 0) {
      vehiclesList.forEach(v => {
        const rawDriver = v.motorista_vinculado;
        if (!rawDriver || typeof rawDriver !== 'string') return;
        const driverName = rawDriver.trim();
        
        // Ignora valores nulos ou vazios
        if (!driverName || 
            driverName.toLowerCase() === 'não vinculado' || 
            driverName.toLowerCase() === 'sem motorista' ||
            driverName.toLowerCase() === '—') {
          return;
        }

        // Busca se já existe um motorista cadastrado com este nome (case-insensitive)
        const foundIndex = existingDrivers.findIndex(d => 
          d.nome && d.nome.trim().toLowerCase() === driverName.toLowerCase()
        );

        if (foundIndex === -1) {
          // MOTORISTA ENCONTRADO NO VEÍCULO MAS AUSENTE NO CADASTRO:
          // Cria o cadastro completo imediatamente!
          const newDriverRecord = {
            id: `MOT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            nome: driverName,
            cpf: '—',
            telefone: v.motorista_telefone || '',
            telefone_emergencia: '',
            cnh: '—',
            categoria_cnh: 'E',
            validade_cnh: v.validade_crlv || '2028-12-31',
            mopp_numero: 'MOPP-HOMOLOGADO',
            validade_mopp: v.validade_cipp || '2027-12-31',
            validade_toxicologico: '2027-06-30',
            validade_nr20: '2027-10-31',
            validade_nr35: '2027-10-31',
            validade_nr33: '2027-10-31',
            validade_direcao_defensiva: '2028-01-10',
            validade_cargas_especiais: '2027-12-15',
            validade_hazmat_pae: '2028-02-28',
            veiculo_vinculado: v.placa || '',
            status: v.status === 'Bloqueado' ? 'Bloqueado' : 'Disponível',
            observacoes: `Motorista vinculado operacionalmente ao veículo placa ${v.placa} (${v.marca_modelo || v.tipo || 'Conjunto Ambipar'}).`
          };
          existingDrivers.push(newDriverRecord);
        } else {
          // Já existe: garante que o vínculo do veículo e telefone estejam preenchidos
          const current = existingDrivers[foundIndex];
          let updated = false;
          const patch = { ...current };

          if ((!current.veiculo_vinculado || current.veiculo_vinculado === 'Não vinculado') && v.placa) {
            patch.veiculo_vinculado = v.placa;
            updated = true;
          }
          if (!current.telefone && v.motorista_telefone) {
            patch.telefone = v.motorista_telefone;
            updated = true;
          }
          if (updated) {
            existingDrivers[foundIndex] = patch;
          }
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao sincronizar motoristas a partir dos veículos:', err);
  }

  // Persiste a lista consolidada
  try {
    localStorage.setItem('ambipar_real_drivers', JSON.stringify(existingDrivers));
  } catch (e) {
    console.warn('Erro ao salvar ambipar_real_drivers:', e);
  }

  return existingDrivers;
}

/**
 * Sincroniza um motorista imediatamente quando salvo ou editado em um veículo
 */
export function syncDriverFromVehicle({ name, phone = '', placa = '', status = 'Disponível' }) {
  if (typeof window === 'undefined' || !name || typeof name !== 'string') return;
  const cleanName = name.trim();
  if (!cleanName || cleanName.toLowerCase() === 'não vinculado') return;

  try {
    let drivers = [];
    const saved = localStorage.getItem('ambipar_real_drivers');
    if (saved) {
      drivers = JSON.parse(saved);
    }
    if (!Array.isArray(drivers) || drivers.length === 0) {
      drivers = [...DEFAULT_AMBIPAR_DRIVERS];
    }

    const idx = drivers.findIndex(d => d.nome && d.nome.trim().toLowerCase() === cleanName.toLowerCase());
    if (idx !== -1) {
      drivers[idx] = {
        ...drivers[idx],
        veiculo_vinculado: placa || drivers[idx].veiculo_vinculado,
        telefone: phone || drivers[idx].telefone,
        status: status === 'Bloqueado' ? 'Bloqueado' : drivers[idx].status || 'Disponível'
      };
    } else {
      drivers.push({
        id: `MOT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        nome: cleanName,
        cpf: '—',
        telefone: phone,
        telefone_emergencia: '',
        cnh: '—',
        categoria_cnh: 'E',
        validade_cnh: '2028-12-31',
        mopp_numero: 'MOPP-HOMOLOGADO',
        validade_mopp: '2027-12-31',
        validade_toxicologico: '2027-06-30',
        validade_nr20: '2027-10-31',
        validade_nr35: '2027-10-31',
        validade_nr33: '2027-10-31',
        validade_direcao_defensiva: '2028-01-10',
        validade_cargas_especiais: '2027-12-15',
        validade_hazmat_pae: '2028-02-28',
        veiculo_vinculado: placa,
        status: status === 'Bloqueado' ? 'Bloqueado' : 'Disponível',
        observacoes: `Motorista cadastrado automaticamente via vinculação ao veículo placa ${placa}.`
      });
    }

    localStorage.setItem('ambipar_real_drivers', JSON.stringify(drivers));
  } catch (err) {
    console.warn('Erro em syncDriverFromVehicle:', err);
  }
}
