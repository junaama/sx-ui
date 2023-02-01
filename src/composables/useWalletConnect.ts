import { ref } from 'vue';
import { isAddress } from '@ethersproject/address';
import WalletConnect from '@walletconnect/client';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import { formatUnits } from '@ethersproject/units';
import { getABI } from '@/helpers/etherscan';
import { Interface } from '@ethersproject/abi';

let connector;
export function useWalletConnect() {
  const logged = ref(false);
  const loading = ref(false);
  const acc = ref('');
  const requests = ref([])

  async function logout() {
    if (connector) {
      await connector.killSession();
      logged.value = false;
    } else {
      return;
    }
  }

  function parseTransaction(call, abi) {
    const iface = new Interface(abi);
    return JSON.parse(JSON.stringify(iface.parseTransaction(call)));
  }
  async function parseCall(call) {
    console.log('Call', call);
    if (call.method === 'eth_sendTransaction') {
      console.log('Send transaction');
      const params = call.params[0];
      const abi = await getABI(params.to);
      console.log('Got ABI contract');
      const tx = parseTransaction(params, abi);
      console.log('Tx', tx);
      return [
        {
          to: params.to,
          value: formatUnits(params.value || 0),
          method: tx.signature,
          params: tx.args,
          operation: 0,
          _data: {
            call,
            tx
          }
        }
      ];
    }
    return false;
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
    // call requests
    connector.on('call_request', async (error, payload) => {
        console.log('Call request', error, payload);
        if (error) throw error;
        try {
          const request: any = await parseCall(payload);
          console.log('Request', request);
          // @ts-ignore
          if (request) requests.value.push(request);
        } catch (e) {
          console.log(e);
        }
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
    logout,
    requests
  };
}
