<script setup lang="ts">
import { storeToRefs } from 'pinia';
import FriLogo from '../components/FriLogo.vue';
import { useClassroomStore } from '../stores/classroom';
import { computed, ref } from 'vue';

const classroomStore = useClassroomStore();

const { classrooms } = storeToRefs(classroomStore);

const filteredClassrooms = computed(() => {
  const query = searchQuery.value.toLowerCase();

  return classrooms.value
    .filter(
      (classroom) =>
        classroom.name.toLowerCase().includes(query) ||
        classroom.slug?.toLowerCase().includes(query),
    )
    .map((e) => ({ ...e, sortName: (e.slug ?? e.name).replace(/^PR?/g, '') }))
    .sort((a, b) => a.sortName.localeCompare(b.sortName));
});

const searchQuery = ref('');
</script>

<template>
  <main>
    <FriLogo />
    <h1>Učilnice</h1>
    <input type="text" v-model="searchQuery" placeholder="Išči..." autofocus />
    <div class="grid">
      <router-link
        :to="{ name: 'HomeView', query: { room: classroom.slug } }"
        v-for="classroom in filteredClassrooms"
        :key="classroom.id"
        class="classroom-card"
      >
        <h2>{{ classroom.slug }}</h2>
        <p>{{ classroom.name }}</p>
      </router-link>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

main {
  padding: 4rem;
}

h1 {
  font-size: 4rem;
  color: $black;
  font-weight: 700;
  margin: 1rem 0;
}

input {
  padding: 1rem;
  font-size: 2rem;
  border: none;
  border-bottom: 0.2rem solid $gray-light;
  margin-bottom: 2rem;
  outline: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1rem;
  padding: 0;
  margin: 0;
}

.classroom-card {
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  font-size: 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: $black;
  background-color: $gray-lightest;

  &:hover {
    background-color: $primary;
    color: $white;
  }

  h2 {
    font-size: 3rem;
    font-weight: 700;
    margin-right: 1rem;
  }
}
</style>
