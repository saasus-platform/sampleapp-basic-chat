<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// 一時コードからIDトークンなどの認証情報を取得するコントローラを登録
Route::get('/callback', 'AntiPatternInc\Saasus\Laravel\Controllers\CallbackApiController@index');
Route::get('/token/refresh', 'AntiPatternInc\Saasus\Laravel\Controllers\TokenRefreshApiController@index');

// SaaSus SDK標準のAuth Middlewareを利用する
Route::middleware(\AntiPatternInc\Saasus\Laravel\Middleware\Auth::class)->group(function () {
  Route::get('/board', 'App\Http\Controllers\MessageApiController@index');
  Route::post('/post', 'App\Http\Controllers\MessageApiController@post');
  Route::get('/plan', 'App\Http\Controllers\PlanApiController@index');
  Route::get('/tenant', 'App\Http\Controllers\TenantApiController@index');
});
