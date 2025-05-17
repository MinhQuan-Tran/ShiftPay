// src/stores/auth.ts
import { defineStore } from 'pinia';
import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';

const scopes = ['https://shiftpay.onmicrosoft.com/api/access_as_user', 'openid', 'offline_access'];

export const useAuthStore = defineStore('auth', {
  state: () => ({
    msalInstance: null as PublicClientApplication | null,
    account: null as AccountInfo | null,
    accessToken: '' as string
  }),

  actions: {
    async init() {
      this.msalInstance = new PublicClientApplication({
        auth: {
          clientId: '37cdd807-8536-47d3-a393-c455fd68e5f1',
          authority: 'https://shiftpay.b2clogin.com/shiftpay.onmicrosoft.com/B2C_1_signup_signin',
          knownAuthorities: ['shiftpay.b2clogin.com'],
          redirectUri: window.location.origin
        },
        cache: {
          cacheLocation: 'localStorage', // persist across browser sessions
          storeAuthStateInCookie: false // for older browsers, you can set true if needed
        }
      });
      await this.msalInstance.initialize();

      // Restore the active account from cached accounts
      const currentAccounts = this.msalInstance.getAllAccounts();

      if (currentAccounts.length > 0) {
        this.account = currentAccounts[0];
        this.msalInstance.setActiveAccount(this.account);

        console.log('Account restored');
      }
    },

    async login() {
      if (!this.msalInstance) await this.init();

      const loginResponse = await this.msalInstance!.loginPopup({
        scopes: scopes
      });

      this.account = loginResponse.account!;
      this.msalInstance!.setActiveAccount(this.account);

      console.log('Login successful');
    },

    async fetchToken() {
      if (!this.msalInstance || !this.account) throw new Error('Not logged in');

      const result = await this.msalInstance.acquireTokenSilent({
        account: this.account,
        scopes: scopes
      });

      this.accessToken = result.accessToken;

      console.log('Token fetched successfully');
      return this.accessToken;
    },

    async logout() {
      await this.msalInstance?.logoutPopup();
      this.account = null;
      this.accessToken = '';
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.account
  }
});
