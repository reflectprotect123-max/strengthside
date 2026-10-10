/** WHOOP account routes. Identity comes from verified JWTs, never client owner IDs. */
export async function statusForOwner(owner: string, io: any) {
 const [token,data]=await Promise.all([io.loadToken('whoop',owner),io.loadData('whoop',owner)]);
 return {whoop:{connected:!!token,lastSyncAt:data?.syncedAt||null,sampleDate:data?.normalized?.date||null,normalized:data?.normalized||null}};
}
export async function disconnectForOwner(owner: string, provider: string | null, io: any) {
 if(provider!=='whoop')throw Object.assign(new Error('unsupported_provider'),{status:400});
 const [token,data]=await Promise.all([io.loadToken('whoop',owner),io.loadData('whoop',owner)]);
 if(token?.access_token)try{await io.revokeWhoopToken(token);}catch(error){if(!io.isWhoopUnauthorized(error))throw error;}
 await io.removeToken('whoop',owner,data?.providerUserId||token?.athlete?.id);
 return {ok:true,provider:'whoop'};
}
