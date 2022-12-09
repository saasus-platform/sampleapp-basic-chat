<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Message;

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
        $tenant_id = $request->userinfo['tenants'][0]['id'];
        $plan_id = $request->userinfo['tenants'][0]['plan_id'];

        // SaaSus SDKを使ってSaaSus APIを叩いて、各種情報を取得し、判断に使う
        $client = new \AntiPatternInc\Saasus\Api\Client();
        $pricingApi = $client->getPricingClient();
        $res = $pricingApi->getPricingPlan($plan_id, $pricingApi::FETCH_RESPONSE);
        $plan = json_decode($res->getBody(), true);

        $meteringUnitName = "comment_count";
        $res = $pricingApi->getMeteringUnitDateCountByTenantIdAndUnitNameToday($tenant_id, $meteringUnitName, $pricingApi::FETCH_RESPONSE);
        $count = json_decode($res->getBody(), true);

        $upper = \AntiPatternInc\Saasus\Api\Lib::findUpperCountByMeteringUnitName($plan, $meteringUnitName);

        $result = '';
        // 現在契約中の料金プランの上限コメント数を超えていたら、投稿できなくする
        if ($count['count'] < $upper || $upper === 0) {
            $result = Message::create([
                'tenant_id' => $tenant_id,
                'user_id' => $request->userinfo['tenants'][0]['user_attribute']['username'],
                'message' => $request->message,
            ]);
            // メータリングAPIで、コメント数に１を足す
            $param = new \AntiPatternInc\Saasus\Sdk\Pricing\Model\UpdateMeteringUnitDateCountTodayParam;
            $param->setMethod('add');
            $param->setCount(1);
            $res = $pricingApi->updateMeteringUnitDateCountToday($request->userinfo['tenants'][0]['id'], $meteringUnitName, $param, $pricingApi::FETCH_RESPONSE);
        }

        return response()->json($result);
    }
}
