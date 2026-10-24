import {PARTNER_TYPES} from './partnerValidation.js';
export const quoteTypeCodes=Object.keys(PARTNER_TYPES);
export function quotePartnerMatches(partner,selected=[]){const marked=partner?.onboarding_profile?.tipos_oficina;return partner?.status==='ativo'&&!partner.deleted_at&&Array.isArray(marked)&&selected.some(code=>PARTNER_TYPES[code]&&marked.includes(PARTNER_TYPES[code]));}
export const quoteRecipients=(partners,selected)=>partners.filter(p=>quotePartnerMatches(p,selected));
export function validQuoteTypes(value){return Array.isArray(value)&&value.length<=quoteTypeCodes.length&&value.every(code=>quoteTypeCodes.includes(code));}
