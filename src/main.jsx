import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicDriverPortal from './components/maintenance/driver-requests/PublicDriverPortal.jsx'
import PublicPartnerRegistration from './components/maintenance/registration/PublicPartnerRegistration.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname.replace(/\/$/,'')==='/cadastro/oficinas'?<PublicPartnerRegistration/>:window.location.pathname.replace(/\/$/,'')==='/motoristas/solicitar-manutencao'?<PublicDriverPortal/>:<App />}
  </StrictMode>,
)
