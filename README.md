## Laravel 9 + Vue CLI 5 + Authentication + Buefy | STARTER
Example config your Laravel project

## Steps for Scaffolding From Scratch
1. Create Laravel Project

   ``` sh
   laravel new my-project
   cd my-project
   # remove existing frontend scaffold
   rm -rf package.json webpack.mix.js resources/js resources/css
   ```

2. Create a Vue CLI 5 project
   ``` sh
   vue create front
   cd front
   ```

3. Configure Vue CLI 5 project

    Edit `/front/vue.config.js`:
    ``` js
    const { defineConfig } = require('@vue/cli-service')
    module.exports = defineConfig({
        transpileDependencies: true,

        devServer: {
            host: 'nc.local',
            // When devServer.proxy is set to a string, only XHR requests will be proxied.
            // proxy: 'http://nc.local',
            // @see: https://github.com/starkovsky/laravel-vue-cli
            proxy: {
                '/spa': {
                    target: 'http://nc.local',
                },
                // staticki asseti su u public/static
                // logo, images i slicne stvari
                '/static': {
                    target: 'http://nc.local',
                }
            },
        },

        lintOnSave: process.env.NODE_ENV !== 'production',
        productionSourceMap: false,
        css: {
            sourceMap: false
        },

        // output built static files to Laravel's public dir.
        // note the "build" script in package.json needs to be modified as well.
        outputDir: '../public/assets',

        publicPath: process.env.NODE_ENV === 'production'
            ? '/assets/'
            : '/',

        // modify the location of the generated HTML file.
        // Specify the output path for the generated index.html (relative to outputDir). Can also be an absolute path.
        indexPath: process.env.NODE_ENV === 'production'
            ? '../../resources/views/index.blade.php'
            : 'index.html'
    })
    ```

    Edit `/resources/frontend/app/package.json`:
    ``` diff
    "scripts": {
      "serve": "vue-cli-service serve",
    - "build": "vue-cli-service build",
    + "build": "rm -rf ../../../public/assets/app/{js,css,img} && vue-cli-service build --no-clean",
      "lint": "vue-cli-service lint"
    },
    ```

4. Configure Laravel routes for SPA.

    **routes/web.php**

    ``` php
    Route::get('/', [HomeController::class, 'index']);

    // na produkciji moramo odgovoriti na refresh + /assets
    // tj povesti korisnika na spa index page
    Route::any('/{any}', [HomeController::class, 'index'])->where('any', '^(?!spa).*$');
    ```

    **app/Http/Controllers/FrontendController.php**

    ``` php
    <?php
    namespace App\Http\Controllers;
    use Illuminate\Http\Request;

    class HomeController extends Controller
    {

        /**
         * Index page
         *
         * @return \Illuminate\Http\Response
         */
        public function index()
        {
            return view('index');
        }

    }
    ```

5. Add vue router, vuex and axios
    ``` js
    vue add router
    vue add vuex
    npm install axios --save
    ```

6. Add authentication routes to backend:

    routes/web.php
    ``` php
    // Routes for SPA API calls
    Route::prefix('spa')->group(function () {

        Route::post('login', [LoginController::class, 'login']);
        Route::post('logout', [LoginController::class, 'logout']);
        Route::get('csrf-cookie', [CsrfCookieController::class, 'show']);

        /**
         * Stranice dozvoljene za pristup samo autorizovanim korisnicima
         */
        Route::group(['middleware' => 'auth'], function () {
            Route::get('check', [HomeController::class, 'check']);

            require __DIR__.'/spa.php';
        });
    });
    ```

    LoginController.php
    ``` php
    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Validation\ValidationException;

    class LoginController extends Controller
    {
        /**
         * Handle an authentication attempt.
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function login(Request $request)
        {
            $credentials = $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required'],
            ]);

            if (Auth::attempt($credentials)) {
                $request->session()->regenerate();

                // status 200 confirms credentials validity
                return new JsonResponse([], 200);
            }

            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        /**
         * Log the user out of the application.
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function logout(Request $request)
        {
            Auth::logout();

            $request->session()->invalidate();

            $request->session()->regenerateToken();

            // status 200 confirms credentials validity
            return new JsonResponse([], 200);
        }
    }
    ```

    CsrfCookieController.php
    ``` php
    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Http\Response;

    class CsrfCookieController
    {
        /**
         * Return an empty response simply to trigger the storage of the CSRF cookie in the browser.
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function show(Request $request)
        {
            if ($request->expectsJson()) {
                return new JsonResponse(null, 204);
            }

            return new Response('', 204);
        }
    }
    ```

    HomeController.php `check()` method
    ``` php
    /**
     * Check if the user is authenticated
     *
     * @return null
     */
    public function check()
    {
        return 'cool';
    }
    ```

7. Add authentication to frontend:

    main.js
    ``` js
    import Vue from 'vue'
    import App from './App.vue'
    import router from './router'
    import store from './store'
    import axios from 'axios'

    Vue.config.productionTip = false

    axios.defaults.withCredentials = true

    store.dispatch('auth/me').then(() => {
        new Vue({
            store,
            router,
            render: h => h(App)
        }).$mount('#app')
    })
    ```

    store/auth.js
    ``` js
    import axios from 'axios'

    export default {
        namespaced: true,

        state: {
            authenticated: false,
            // user: null
        },

        getters: {
            authenticated (state) {
                return state.authenticated
            },

            // user (state) {
            //     return state.user
            // },
        },

        mutations: {
            SET_AUTHENTICATED (state, value) {
                state.authenticated = value
            },

            // SET_USER (state, value) {
            //     state.user = value
            // }
        },

        actions: {
            async signIn ({ dispatch }, credentials) {
                await axios.get('/spa/csrf-cookie')
                await axios.post('/spa/login', credentials)

                return dispatch('me')
            },

            async signOut ({ dispatch }) {
                await axios.post('/spa/logout')

                return dispatch('me')
            },

            me ({ commit }) {
                return axios.get('/spa/check').then((response) => {
                    commit('SET_AUTHENTICATED', true)
                    // commit('SET_USER', response.data)
                }).catch(() => {
                    commit('SET_AUTHENTICATED', false)
                    // commit('SET_USER', null)
                })
            }
        }
    }
    ```

8. Add init user to UserSeed and run databases migrations with seed flag:

    ``` sh
    php artisan migrate --seed
    ```
