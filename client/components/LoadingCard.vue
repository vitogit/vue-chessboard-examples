<script>
import ethMixin from '../mixins/ethereum';
import Card from './Card';
import BlackPawn from '../assets/icons/blackpawn.svg';

export default {
  name: 'ChallengeCard',
  props: {
    player: String,
  },
  components: { Card, BlackPawn },
  mixins: [ ethMixin ],
  computed: {}
}
</script>

<template>
  <Card>
    <BlackPawn />
    <div class='text-sm text-center'>
      <div>{{ truncAddress(player) }}</div>
      <div>Loading...</div>
    </div>
  </Card>
</template>
