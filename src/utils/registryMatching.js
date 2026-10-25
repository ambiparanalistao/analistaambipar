const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
export function driverForVehicle(vehicle,drivers){if(!vehicle)return null;const byPlate=drivers.filter(d=>norm(d.veiculo_vinculado)&&norm(d.veiculo_vinculado)===norm(vehicle.placa));if(byPlate.length===1)return byPlate[0];if(byPlate.length>1)return null;const byName=drivers.filter(d=>norm(d.nome)&&norm(d.nome)===norm(vehicle.motorista_vinculado));return byName.length===1?byName[0]:null;}

