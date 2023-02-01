<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { clone } from '@/helpers/utils';
import { validateForm } from '@/helpers/validation';
import { useWeb3 } from '@/composables/useWeb3';
import { useWalletConnect } from '@/composables/useWalletConnect';
import { shorten } from '@/helpers/utils';
import { explorerUrl } from '@/helpers/utils';

const DEFAULT_FORM_STATE = {
  uri: ''
};

const props = defineProps({
  open: Boolean,
  connectionLink: {
    type: String,
    required: true
  },
  initialState: Object
});

const emit = defineEmits(['close']);

const ignoreFormUpdates = ref(true);

const form = reactive(clone(DEFAULT_FORM_STATE));

const { connect, logged, logout, loading } = useWalletConnect();
const { web3 } = useWeb3();

async function handleSubmit() {
  const account = web3.value.account;
  try {
    await connect(account, form.uri);
    emit('close');
  } catch (error) {
    console.error(error);
  }
}

async function handleDisconnect() {
  try {
    await logout();
  } catch (error) {
    console.error(error);
  }
  form.uri = DEFAULT_FORM_STATE.uri;
}

const errors = computed(() =>
  validateForm(
    {
      type: 'object',
      properties: {
        uri: {
          type: 'string'
          // @junaama TODO: add format validation for walletconnect uri
        }
      },
      additionalProperties: true
    },
    { uri: form.uri }
  )
);

watch(
  () => form.uri,
  async v => {
    if (ignoreFormUpdates.value === true) return;
  }
);

watch(
  () => props.open,
  () => {
    if (props.initialState) {
      form.uri = props.initialState.uri;
      ignoreFormUpdates.value = true;
    } else {
      form.uri = DEFAULT_FORM_STATE.uri;
      ignoreFormUpdates.value = false;
    }
  }
);
</script>

<template>
  <UiModal :open="open" @close="$emit('close')">
    <template #header>
      <h3 v-text="'WalletConnect'" />
    </template>
    <div class="s-box p-4" v-if="!logged">
      <UiLoading v-if="loading" class="absolute top-[14px] right-3 z-10" />
      <SIString
        v-model="form.uri"
        :error="errors.uri"
        :definition="{
          type: 'string',
          title: 'Connection link',
          examples: ['e.g. wc:a7577083-65eb']
        }"
      />
    </div>

    <template #footer>
      <div class="space-y-2">
        <a
          v-if="logged"
          :href="explorerUrl(web3.network.key, web3.account)"
          target="_blank"
          class="block"
        >
          <UiButton class="button-outline w-full flex justify-center items-center">
            <Stamp :id="web3.account" :size="18" class="mr-2 -ml-1" />
            <span v-text="web3.name || shorten(web3.account)" />
            <IH-external-link class="inline-block ml-1" />
          </UiButton>
        </a>
        <UiButton v-if="logged" class="w-full !text-red" @click="handleDisconnect"
          >Log out</UiButton
        >
        <UiButton v-else class="w-full" @click="handleSubmit" :loading="loading">Connect</UiButton>
      </div>
    </template>
  </UiModal>
</template>
