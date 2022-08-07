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
    public const TENANT_NAME = 'テナント1';

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

        // SaaSus SDKを使ってSaaSus APIを叩いて、各種情報を取得し、判断に使う
        $api = new \AntiPatternInc\Saasus\Sdk\Auth\Api();
        $tenantid = $request->userinfo['tenants'][0]['id'];
        // メータリングのメータ、comment_count(コメント数)を使う
        $meter = "comment_count";
        $user = $api->getUser($tenantid, $request->userinfo['uuid']);
        $tenant = $api->getTenant($tenantid);
        $plan = $api->getPricingPlan($tenant['plan_id']);
        // 今回は、１日ごとの上限コメント数として扱う
        $count = $api->getMeteringUnitDateCount($tenantid, $meter);

        $upper = \AntiPatternInc\Saasus\Sdk\Lib::findUpperCountByMeteringUnitName($plan, $meter);

        // 現在契約中の料金プランの上限コメント数を超えていたら、投稿できなくする
        if ($count['count'] < $upper || $upper === 0) {
            $message = Message::create([
                'tenant_id' => $request->userinfo['tenants'][0]['id'],
                'user_id' => $user['attributes']['username'],
                'message' => $request->message,
            ]);
            // メータリングAPIで、コメント数に１を足す
            $count = $api->addMeteringUnitDateCount($tenantid, $meter, 1);
        }

        $request->session()->regenerateToken();
        return redirect()->route('board');
    }
}
