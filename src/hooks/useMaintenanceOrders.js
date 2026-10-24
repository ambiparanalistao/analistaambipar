import {useEffect,useState} from 'react';
import {listOrders,orderOptions,orderDetail} from '../services/maintenanceOrders';
export default function useMaintenanceOrders(company,filters,page,board,id){
 const [options,setOptions]=useState({loading:true,data:null,error:''}),[list,setList]=useState({loading:true,rows:[],count:0,error:''}),[detail,setDetail]=useState({loading:false,data:null,error:''}),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setOptions({loading:true,data:null,error:''});orderOptions(company).then(data=>{if(active)setOptions({loading:false,data,error:''});}).catch(e=>{if(active)setOptions({loading:false,data:null,error:e.message});});return()=>{active=false;};},[company,revision]);
 useEffect(()=>{let active=true;const c=new AbortController();setList({loading:true,rows:[],count:0,error:''});listOrders(company,filters,page,board,c.signal).then(data=>{if(active)setList({...data,loading:false,error:''});}).catch(e=>{if(active)setList({loading:false,rows:[],count:0,error:e.message});});return()=>{active=false;c.abort();};},[company,filters,page,board,revision]);
 useEffect(()=>{let active=true;setDetail({loading:!!id,data:null,error:''});if(id)orderDetail(company,id).then(data=>{if(active)setDetail({loading:false,data,error:''});}).catch(e=>{if(active)setDetail({loading:false,data:null,error:e.message});});return()=>{active=false;};},[company,id,revision]);
 return{options,list,detail,reload:()=>setRevision(v=>v+1)};
}
