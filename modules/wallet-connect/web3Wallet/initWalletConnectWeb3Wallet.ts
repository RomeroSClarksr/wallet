import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { IWeb3Wallet } from '@walletconnect/web3wallet/dist/types/types/client';
import Realm from 'realm';

import { showToast } from '@/components/Toast';
import { SecuredKeychainContext } from '@/secureStore/SecuredKeychainProvider';

import { enqueueAppRequest } from '../appRequestQueue';
import { ReactNavigationDispatch } from '../types';

import { WalletConnectSessionsManager as WalletConnectSessionsManager_ } from '../WalletConnectSessionsManager';

import { handleSessionProposal } from './handleSessionProposal';
import { handleSessionRequest } from './handleSessionRequest';

import { WALLETCONNECT_PROJECT_ID } from '/config';

const core = new Core({
  projectId: WALLETCONNECT_PROJECT_ID,
});

const metadata = {
  name: 'Kraken Wallet',
  description: 'Kraken Wallet',
  url: '#',
  icons: ['https://www.kraken.com/_assets/icons/apple-touch-icon.png'],
};

export let web3Wallet: IWeb3Wallet | undefined;


let dispatch_: ReactNavigationDispatch;
const getDispatch_ = (): ReactNavigationDispatch => dispatch_;

let realm_: Realm;
const getRealm_ = (): Realm => realm_;

export const WalletConnectSessionsManager = new WalletConnectSessionsManager_();



const sessionProposals: string[] = [];



export async function initWalletConnectWeb3Wallet(
  realm: Realm,
  dispatch: ReactNavigationDispatch,
  getSeed: SecuredKeychainContext['getSeed'],
): Promise<IWeb3Wallet> {
  
  realm_ = realm;
  dispatch_ = dispatch;

  if (web3Wallet) {
    return web3Wallet;
  }

  
  web3Wallet = await Web3Wallet.init({
    core,
    metadata,
  });

  WalletConnectSessionsManager.setWeb3Wallet(web3Wallet);

  web3Wallet.on('session_request', event => {
    enqueueAppRequest(() => {
      if (web3Wallet) {
        return handleSessionRequest({ web3Wallet, event, realm: getRealm_(), dispatch: getDispatch_(), getSeed });
      }
      return new Promise(resolve => resolve());
    });
  });

  web3Wallet.on('session_proposal', proposal => {
    const hasBeenProposed = sessionProposals.includes(String(proposal.id));

    
    if (!hasBeenProposed) {
      sessionProposals.push(String(proposal.id));
      enqueueAppRequest(() => {
        return handleSessionProposal(proposal, getDispatch_());
      });
    }
  });

  web3Wallet.on('auth_request', () => showToast({ type: 'info', icon: 'plug-disconnected', text: 'Action not implemented: auth_request' }));

  return web3Wallet;
  
}
