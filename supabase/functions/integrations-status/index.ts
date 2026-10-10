import {statusForOwner} from '../_shared/integrations.ts';
import {ownerFromRequest} from '../_shared/auth.ts';
import {loadData,loadToken} from '../_shared/oauth.ts';
import {json,preflight,methodGuard} from '../_shared/http.ts';
Deno.serve(async(req:Request)=>{
 const early=preflight(req)||methodGuard(req,['GET']);if(early)return early;
 try{const {owner}=await ownerFromRequest(req);return json(await statusForOwner(owner,{loadToken,loadData}));
 }catch(error){return json({error:'status_failed'},(error as Error & {status?:number}).status||500);}
});
