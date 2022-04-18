import axios from 'axios'

// https://dev.to/kevinleedrum/axios-tips-for-real-world-apps-3bo4
// https://github.com/axios/axios
const http = axios.create({

    // `baseURL` will be prepended to `url` unless `url` is absolute.
    // It can be convenient to set `baseURL` for an instance of axios to pass relative URLs
    // to methods of that instance.
    // baseURL: '/spa',
    withCredentials: true,
    baseURL: '/spa',
})

const successHandler = (response) => {
    // if (isHandlerEnabled(response.config)) {
    //   // Handle responses
    // }
    // return response

    // @see Illuminate\Foundation\Auth\AuthenticatesUsers::logout
    // regularni logout response
    // if (response.status === 204) {
    //     window.location = '/login';
    // }

    return response.data
}

const errorHandler = (error) => {
    // if (isHandlerEnabled(error.config)) {
    //   // Handle errors
    // }

    // in case of error.message == 'Network Error', error.response is undefined
    if(error.response) {
        // Add response interceptor to AXIOS instance for automatic forward
        // to login page in case of session expiration.
        if (error.response.status == 401 || error.response.data.exception == "Illuminate\\Session\\TokenMismatchException") {
            window.location = '/login';
        }

        // Show custom error message if we have one, ex. abort(403, 'Operation is not allowed')
        if (error.response.data.message) {
            return Promise.reject(new Error(error.response.data.message))
        }
    }

    return Promise.reject(error)
}

// axios interceptors
http.interceptors.response.use(
    // https://dev.to/teroauralinna/global-http-request-and-response-handling-with-the-axios-interceptor-30ae
    response => successHandler(response),
    error => errorHandler(error)
);


/* ---------------------------------------------------------
 * API routes
 * ---------------------------------------------------------
 */
const app = {
    // checkSession: () => http.get('/check-session'),
    logout: () => http.post('/logout'),
    upload: (formData) => http.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    }),
}

const profile = {
    get: () => http.get('/profile'),
    // update: () => http.put('/profile', params),
    delete: () => http.delete('/profile'),
}

const users = {
    all: () => http.get('users')
}

/* ---------------------------------------------------------
 * JS Module export
 * ---------------------------------------------------------
 */
export default {
    app,
    profile,
    users,
}