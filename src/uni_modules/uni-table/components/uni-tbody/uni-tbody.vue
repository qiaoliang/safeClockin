<template>
  <!-- #ifdef H5 -->
  <tbody>
    <slot />
  </tbody>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view><slot /></view>
  <!-- #endif -->
</template>

<script>
export default {
	name: 'UniBody',
	options: {
		// #ifdef MP-TOUTIAO
		virtualHost: false,
		// #endif
		// #ifndef MP-TOUTIAO
		virtualHost: true
		// #endif
	},
	data() {
		return {

		}
	},
	created() {},
	methods: {}
}
</script>

<style>
</style>
