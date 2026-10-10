import {disconnectForOwner} from '../_shared/integrations.ts';
import {ownerFromRequest} from '../_shared/auth.ts';
import {loadData,loadToken,removeToken} from '../_shared/oauth.ts';
import {isWhoopUnauthorized,revokeWhoopToken,whoopErrorResponse} from '../_shared/whoop.ts';
import {json,preflight,methodGuard} from '../_shared/http.ts';
Deno.serve(async(req:Request)=>{
 const early=preflight(req)||methodGuard(req,['POST']);if(early)return early;
 try{
 const {owner}=await ownerFromRequest(req);
 return json(await disconnectForOwner(owner,new URL(req.url).searchParams.get('provider'),{loadToken,loadData,removeToken,isWhoopUnauthorized,revokeWhoopToken}));
 }catch(error){const response=whoopErrorResponse(error,'disconnect_failed');return json(response.body,response.status);}
});
