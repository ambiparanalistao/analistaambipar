import type {Row,Insert,MaintenanceUpdate,MaintenanceRole} from '../src/types/database.maintenance';
const role:MaintenanceRole='supervisor';
const data:Insert<'maintenance_partners'>={company_id:'company',razao_social:'Oficina',atende_24h:true};
const version:Row<'maintenance_partners'>['version']=2;
// @ts-expect-error clients cannot forge audit inserts
const audit:Insert<'maintenance_partner_audit'>={};
// @ts-expect-error attachments are immutable
const update:MaintenanceUpdate<'maintenance_partner_attachments'>={nome:'fake'};
void [role,data,version,audit,update];
