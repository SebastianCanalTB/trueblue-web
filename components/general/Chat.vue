<script setup lang="ts"></script>

<template>
  <div class="chat-button-component">
    <button class="chat-button">
      <img
        src="/icons/ic_chat_question.svg"
        alt="chat"
        height="25px"
        width="25px"
      />
    </button>
  </div>
</template>
<style scoped lang="scss">
.chat-button-component {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  background-color: white;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  z-index: 2000;

  .chat-button {
  }
}
.menu-chat {
  height: 500px;
  width: 500px;
}
</style>
