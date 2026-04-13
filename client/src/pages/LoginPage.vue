<template>
    <div class="login-container">
        <div class="login-box">
            <h1>Login</h1>
            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" class="btn-login">Login</button>
            </form>
            <p class="signup-link">
                Don't have an account? <router-link to="/signup">Sign up</router-link>
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginPage',
    data() {
        return {
            email: '',
            password: ''
        };
    },
    methods: {
        handleLogin() {
            // Add your login logic here
            console.log('Login attempt:', { email: this.email, password: this.password });
        }
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-weight: 500;
}

input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

input:focus {
    outline: none;
    border-color: #667eea;
}

.btn-login {
    width: 100%;
    padding: 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    transition: background 0.3s;
}

.btn-login:hover {
    background: #5568d3;
}

.signup-link {
    text-align: center;
    margin-top: 20px;
    color: #666;
    font-size: 14px;
}

.signup-link a {
    color: #667eea;
    text-decoration: none;
}

.signup-link a:hover {
    text-decoration: underline;
}
</style>