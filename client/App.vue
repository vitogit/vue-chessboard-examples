<script>
import CryptoWallet from './components/CryptoWallet.vue';
import ConnectWallet from './components/ConnectWallet.vue';
import useWalletStore from './stores/wallet';

export default {
  name: 'App',
  components: {
    CryptoWallet,
    ConnectWallet,
  },
  setup() {
    const wallet = useWalletStore();

    if (typeof window.ethereum === 'undefined') {
      console.log('Metamask is NOT installed!');
      return;
    } else {
      console.log('Metamask is installed!');
      wallet.$patch({
        isInstalled: true,
        isConnected: ethereum.isConnected()
      })
    }

    return { wallet };
  }
}
</script>

<template>
  <div id='app'>
    <div id='sidebar'>
      <div class='container'>
        <div id='header' class='font-smooth'>Blockchain Chess Lounge</div>
        <CryptoWallet
          :ethBalance='wallet.ethBalance'
          :daiBalance='wallet.daiBalance'
        />
        <div id='navigation'>
          <ConnectWallet
            :isInstalled='wallet.isInstalled'
            :isConnected='wallet.isConnected'
            :onClick='() => this.$router.push("/lobby")'
          >Lobby</ConnectWallet>
          <router-link tag='button' to='/ai'>Fun Play</router-link>
          <router-link tag='button' to='/about'>About</router-link>
          <router-link tag='button' to='/settings'>Settings</router-link>
        </div>
      </div>
    </div>

    <div id='page'>
      <router-view />
    </div>
  </div>
</template>

<style lang='scss'>
@import '~bourbon';

// Swallow the page
html, body {
  height: 100%;
  margin: 0;

  #app {
    max-width: 1024px;
    height: 95%;
    @include margin(1em 1em);

    #page {
      max-width: 36em;
    }
  }
}

// Fonts
#app {
  #header {
    font-size: 28px;
    font-weight: bold;
    text-align: center;
  }
}

// Flexboxes
#app {
  display: flex;

  #sidebar {
    flex-basis: 14em;
    display: flex;
    flex-direction: column;

    #navigation {
      display: flex;
      flex-direction: column;
    }
  }

  #page {
    flex: 1;
  }
}

// Margins and padding
#app {
  #sidebar {
    .container {
      @include padding(.5em);
    }

    #wallet {
      @include margin(1em .2em);
      @include padding(.2em .4em);
    }

    #{$all-buttons} {
      @include margin(.4em 2em);
    }
  }

  #page {
    @include margin(.4em 1em);
  }

  #{$all-buttons} {
    @include padding(.2em .4em);
  }

  input {
    @include padding(.2em .4em);
  }
}

// Muted theme
#app {
  * {
    background-color: transparent;
    color: black;
    border-color: black;
  }

  button {
    font-size: 16px;
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
  }

  button:disabled {
    color: lightgrey;
    border-color: lightgrey;
  }

  input {
    font-size: 16px;
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
  }
}

// Sidebar borders
#sidebar .container {
  border-style: solid;
  border-radius: 6px;
  border-width: 3px;

  #wallet {
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
  }
}
</style>
