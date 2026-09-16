package com.hybrid.athlete

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@CapacitorPlugin(name = "HealthConnectSteps")
class HealthConnectStepsPlugin : Plugin() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val stepReadPermission = HealthPermission.getReadPermission(StepsRecord::class)

    @PluginMethod
    fun pokeToday(call: PluginCall) {
        val act = activity
        if (act == null) {
            call.reject("no activity")
            return
        }
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            val obj = JSObject()
            obj.put("available", false)
            obj.put("granted", false)
            obj.put("sdkStatus", status)
            obj.put(
                "reason",
                if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
                    "Install or update Health Connect, then poke again"
                else
                    "Health Connect is not on this phone"
            )
            call.resolve(obj)
            return
        }
        val client = HealthConnectClient.getOrCreate(context)
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.contains(stepReadPermission)) {
                    act.runOnUiThread {
                        val contract = PermissionController.createRequestPermissionResultContract()
                        val intent = contract.createIntent(act, setOf(stepReadPermission))
                        startActivityForResult(call, intent, "hcPerm")
                    }
                    return@launch
                }
                call.resolve(readSteps(client))
            } catch (err: Exception) {
                call.reject(err.message ?: "Health Connect poke failed")
            }
        }
    }

    @ActivityCallback
    fun hcPerm(call: PluginCall, result: ActivityResult) {
        val contract = PermissionController.createRequestPermissionResultContract()
        val granted = contract.parseResult(result.resultCode, result.data)
        if (!granted.contains(stepReadPermission)) {
            val obj = JSObject()
            obj.put("available", true)
            obj.put("granted", false)
            obj.put("reason", "Steps read was not allowed")
            call.resolve(obj)
            return
        }
        scope.launch {
            try {
                call.resolve(readSteps(HealthConnectClient.getOrCreate(context)))
            } catch (err: Exception) {
                call.reject(err.message ?: "Health Connect read failed")
            }
        }
    }

    private suspend fun readSteps(client: HealthConnectClient): JSObject {
        val zone = ZoneId.systemDefault()
        val now = Instant.now()
        val startToday = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        val start3d = LocalDate.now(zone).minusDays(2).atStartOfDay(zone).toInstant()
        val todayAgg = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(startToday, now),
            )
        )
        val threeAgg = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(start3d, now),
            )
        )
        val records = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start3d, now),
            )
        )
        val originCounts = linkedMapOf<String, Long>()
        for (row in records.records) {
            val pkg = row.metadata.dataOrigin.packageName
            originCounts[pkg] = (originCounts[pkg] ?: 0L) + row.count
        }
        val origins = JSArray()
        for ((pkg, count) in originCounts) {
            val item = JSObject()
            item.put("packageName", pkg)
            item.put("count", count)
            origins.put(item)
        }
        val obj = JSObject()
        obj.put("available", true)
        obj.put("granted", true)
        obj.put("stepsToday", todayAgg[StepsRecord.COUNT_TOTAL] ?: 0L)
        obj.put("steps3d", threeAgg[StepsRecord.COUNT_TOTAL] ?: 0L)
        obj.put("origins", origins)
        return obj
    }
}
