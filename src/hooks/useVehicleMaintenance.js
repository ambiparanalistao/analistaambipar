import {useEffect,useState,useCallback} from 'react';
import {vehicleCommand} from '../services/vehicleMaintenance';
export default function useVehicleMaintenance(company,command,body={}){
 const [state,setState]=useState({loading:true,data:null,error:''}),[revision,setRevision]=useState(0),key=JSON.stringify(body);
 const reload=useCallback(()=>setRevision(r=>r+1),[]);
 useEffect(()=>{let active=true;setState({loading:true,data:null,error:''});vehicleCommand(company,command,JSON.parse(key)).then(data=>{if(active)setState({loading:false,data,error:''});}).catch(e=>{if(active)setState({loading:false,data:null,error:e.message});});return()=>{active=false;};},[company,command,key,revision]);
 return{...state,reload};
}
