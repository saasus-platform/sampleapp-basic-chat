<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Message;

use AntiPatternInc\Saasus\Sdk\Auth\Api;
use AntiPatternInc\Saasus\Sdk\Lib;

class MessageApiController extends Controller
{
    public function index(Request $request)
    {
        // SPAの場合でも考え方は同じ
        // 処理は、 MessageController を参照
        $tenantid = $request->userinfo['tenants'][0]['id'];

        $messages = DB::table('messages')
            ->select('messages.*')
            ->where('tenant_id', $tenantid)
            ->get();
        return response()->json($messages);
    }

    public function post(Request $request)
    {
        $api = new Api();
        $tenantid = $request->userinfo['tenants'][0]['id'];
        $meter = "comment_count";

        $user = $api->getUser($tenantid, $request->userinfo['uuid']);
        $tenant = $api->getTenant($tenantid);
        $plan = $api->getPricingPlan($tenant['plan_id']);
        $count = $api->getMeteringUnitDateCount($tenantid, $meter);

        $upper = Lib::findUpperCountByMeteringUnitName($plan, $meter);

        $result = "";
        if ($count['count'] < $upper || $upper === 0) {
            $result = Message::create([
                'tenant_id' => $tenantid,
                'user_id' => $user['attributes']['username'],
                'message' => $request->message,
            ]);
            $count = $api->addMeteringUnitDateCount($tenantid, $meter, 1);
        }

        return response()->json($result);
    }
}
