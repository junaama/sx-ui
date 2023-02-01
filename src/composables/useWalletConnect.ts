import { ref } from 'vue';
import { isAddress } from '@ethersproject/address';
import WalletConnect from '@walletconnect/client';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';

let connector;
export function useWalletConnect() {
  const logged = ref(false);
  const loading = ref(false);
  const acc = ref('');

  async function logout() {
    if (connector) {
      await connector.killSession();
      logged.value = false;
    } else {
      return;
    }
  }

  async function connect(account, uri) {
    acc.value = account;
    if (!isAddress(account)) {
      const provider = getProvider('5');
      acc.value = await provider.resolveName(account);
    }
    if (!acc.value) {
      loading.value = false;
      return;
    }
    connector = new WalletConnect({
      uri,
      storageId: Math.random().toString()
    });
    connector.on('session_request', async (error, payload) => {
      console.log('session_request', error, payload);
      if (error) throw error;
      await connector.approveSession({
        accounts: [account],
        chainId: 5
      });
      console.log('Connected');
      logged.value = true;
      loading.value = false;
    });
    connector.on('disconnect', (error, payload) => {
        console.log('disconnect', error, payload);
        if (error) throw error;
      });

  }
  return {
    connect,
    logged,
    loading,
    acc,
    logout
  };
}
