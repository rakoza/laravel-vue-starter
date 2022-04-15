<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;

// treba biti dozvoljeno svi korisnicima
Route::get('profile', [ProfileController::class, 'getProfile'])->name('profile.get');
Route::put('profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
Route::delete('profile', [ProfileController::class, 'deleteAccount'])->name('account.delete');

// place for protected routes, API routes for SPA
Route::apiResource('users', UserController::class);
