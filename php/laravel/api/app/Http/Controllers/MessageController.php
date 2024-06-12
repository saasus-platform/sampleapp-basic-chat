<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public const PLANS = [
        'プラン A',
        'プラン B',
        'プラン C',
    ];
    public const TENANT_NAME = 'Tenant 1';

    public function index(Request $request)
    {
        // $request->userinfo に各種ユーザ情報、テナント情報が入ってくるので、それを使う
        $messages = Message::where('tenant_id', $request->userinfo['tenants'][0]['id'])->get();
        return view('messageBoard.index', ['messages' => $messages, 'plans' => $this::PLANS, 'tenant_name' => $request->userinfo['tenants'][0]['name']]);
    }

    public function post(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|max:255'
        ]);

        $tenant_id = $request->userinfo['tenants'][0]['id'];
        $plan_id = $request->userinfo['tenants'][0]['plan_id'];

        // SaaSus SDKを使ってSaaSus APIを叩いて、各種情報を取得し、判断に使う
        $client = new \AntiPatternInc\Saasus\Api\Client();
        $pricingApi = $client->getPricingClient();
        $res = $pricingApi->getPricingPlan($plan_id, $pricingApi::FETCH_RESPONSE);
        $plan = json_decode($res->getBody(), true);

        // メータリングのメータ、comment_count(コメント数)を使う
        $meteringUnitName = "comment_count";
        $res = $pricingApi->getMeteringUnitDateCountByTenantIdAndUnitNameToday($tenant_id, $meteringUnitName, $pricingApi::FETCH_RESPONSE);
        // 今回は、１日ごとの上限コメント数として扱う
        $count = json_decode($res->getBody(), true);

        $upper = \AntiPatternInc\Saasus\Api\Lib::findUpperCountByMeteringUnitName($plan, $meteringUnitName);

        // 現在契約中の料金プランの上限コメント数を超えていたら、投稿できなくする
        if ($count['count'] < $upper || $upper === 0) {
            $message = Message::create([
                'tenant_id' => $tenant_id,
                'user_id' => $request->userinfo['tenants'][0]['user_attribute']['username'],
                'message' => $request->message,
            ]);
            // メータリングAPIで、コメント数に１を足す
            $param = new \AntiPatternInc\Saasus\Sdk\Pricing\Model\UpdateMeteringUnitTimestampCountNowParam();
            $param->setMethod('add');
            $param->setCount(1);
            $res = $pricingApi->updateMeteringUnitTimestampCountNow($request->userinfo['tenants'][0]['id'], $meteringUnitName, $param, $pricingApi::FETCH_RESPONSE);
        }

        $request->session()->regenerateToken();
        return redirect()->route('board');
    }
}
