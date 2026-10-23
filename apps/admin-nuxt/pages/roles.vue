<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Gestion des Rôles & Autorisations (RBAC)</h1>
        <p class="text-sm text-slate-500">Configurez les droits d'accès par module et gérez les comptes utilisateurs.</p>
      </div>
      <button @click="openCreateRoleModal" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
        + Nouveau Rôle Personnalisé
      </button>
    </div>

    <!-- System & Custom Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="role in roles" :key="role.id" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <span :class="role.is_system ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'" class="text-[10px] uppercase font-black px-2 py-0.5 rounded">
              {{ role.is_system ? 'Système' : 'Personnalisé' }}
            </span>
            <h2 class="text-lg font-bold text-slate-900 mt-1">{{ role.name }}</h2>
          </div>
          <button @click="editRolePermissions(role)" class="text-xs text-emerald-700 font-bold hover:underline">
            Gérer Permissions
          </button>
        </div>
        <p class="text-xs text-slate-600">{{ role.description || 'Aucune description fournie.' }}</p>
      </div>
    </div>

    <!-- Quick User Management Table with Impersonation Assistance -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 class="text-lg font-bold text-slate-900">Comptes Utilisateurs & Assistance Directe</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th class="p-3">ID</th>
              <th class="p-3">Utilisateur</th>
              <th class="p-3">Rôle</th>
              <th class="p-3">Statut</th>
              <th class="p-3">Actions & Assistance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="p-3 font-mono text-xs">#{{ user.id }}</td>
              <td class="p-3 font-medium">
                <div>{{ user.email }}</div>
                <div class="text-xs text-slate-400">{{ user.first_name }} {{ user.last_name }}</div>
              </td>
              <td class="p-3">
                <span class="bg-slate-800 text-white font-bold text-xs px-2.5 py-1 rounded-lg">{{ user.role }}</span>
              </td>
              <td class="p-3">
                <span :class="user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'" class="text-xs font-bold px-2 py-1 rounded-lg">
                  {{ user.is_active ? 'Actif' : 'Suspendu' }}
                </span>
              </td>
              <td class="p-3 space-x-2">
                <button
                  v-if="user.role !== 'ADMIN'"
                  @click="startAssistanceSession(user)"
                  class="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  ⚡ Mode Assistance
                </button>
                <button
                  @click="toggleUserStatus(user)"
                  :class="user.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'"
                  class="font-bold text-xs px-3 py-1.5 rounded-lg border transition"
                >
                  {{ user.is_active ? 'Suspendre' : 'Réactiver' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const roles = ref([]);
const users = ref([]);

const apiBase = 'http://localhost:4000/api';

async function loadData() {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const rolesRes = await fetch(`${apiBase}/rbac/roles`, { headers });
    if (rolesRes.ok) roles.value = await rolesRes.json();

    const usersRes = await fetch(`${apiBase}/auth`, { headers });
    if (usersRes.ok) users.value = await usersRes.json();
  } catch (err) {
    console.error('Error loading RBAC data:', err);
  }
}

async function startAssistanceSession(targetUser) {
  const reason = prompt(`Indiquez le motif de l'assistance pour le compte ${targetUser.email} :`, "Assistance technique / support client");
  if (!reason) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/admin/impersonate/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId: targetUser.id, reason }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('admin_original_token', token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('impersonated_email', targetUser.email);
      localStorage.setItem('impersonated_role', targetUser.role);
      alert(`Session d'assistance activée pour ${targetUser.email}. Redirection...`);
      window.location.reload();
    } else {
      alert(data.error || "Erreur lors du démarrage de l'assistance.");
    }
  } catch (err) {
    alert("Erreur réseau lors de l'impersonation.");
  }
}

async function toggleUserStatus(user) {
  if (!confirm(`Voulez-vous vraiment ${user.is_active ? 'suspendre' : 'réactiver'} le compte ${user.email} ?`)) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/rbac/users/${user.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !user.is_active }),
    });

    if (res.ok) {
      loadData();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors du changement de statut.");
    }
  } catch (err) {
    alert("Erreur réseau.");
  }
}

function openCreateRoleModal() {
  const name = prompt("Nom du nouveau rôle (ex: COMPTABILITE) :");
  if (!name) return;
  const description = prompt("Description du rôle :");

  const token = localStorage.getItem('token');
  fetch(`${apiBase}/rbac/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  }).then(res => {
    if (res.ok) loadData();
    else alert("Erreur lors de la création du rôle.");
  });
}

function editRolePermissions(role) {
  alert(`Gestionnaire de matrice de permissions pour ${role.name}. Toutes les permissions sont actuellement actives côté backend.`);
}

onMounted(() => {
  loadData();
});
</script>
