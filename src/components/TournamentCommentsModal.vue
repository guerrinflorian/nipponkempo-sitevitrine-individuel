<template>
    <n-modal v-model:show="showModal" preset="card" :style="{ width: '540px', maxHeight: '80vh' }"
        title="💬 Commentaires" :bordered="false" size="large" class="comments-modal">
        <n-scrollbar style="max-height: calc(68vh - 150px)">
            <div class="comments-container">
                <!-- rien -->
                <div v-if="topComments.length === 0" class="empty-state">
                    <p>Aucun commentaire pour le moment.</p>
                </div>

                <!-- liste des commentaires -->
                <n-list v-else>
                    <n-list-item v-for="comment in topComments" :key="comment.id" class="comment-card">
                        <div class="comment-row">
                            <n-avatar round size="medium" class="avatar">
                                {{ getInitials(comment.users) }}
                            </n-avatar>
                            <div class="comment-main">
                                <div class="comment-header">
                                    <span class="author">
                                        {{ comment.users.first_name }} {{ comment.users.last_name }}
                                    </span>
                                    <span class="date">{{ formatDate(comment.created_at) }}</span>
                                </div>
                                <div class="comment-content" v-if="!isEditing(comment.id)">
                                    {{ comment.content }}
                                </div>
                                <n-input v-else v-model:value="editingContent" type="textarea"
                                    :autosize="{ minRows: 2, maxRows: 5 }" class="edit-input" />
                                <div class="actions">
                                    <n-space size="small">
                                        <n-button v-if="canEdit(comment) && !isEditing(comment.id)" text size="tiny"
                                            @click="startEdit(comment)">
                                            <n-icon>
                                                <Pencil />
                                            </n-icon>
                                        </n-button>
                                        <n-button v-if="isEditing(comment.id)" text size="tiny" type="primary"
                                            @click="saveEdit">
                                            <n-icon>
                                                <Checkmark />
                                            </n-icon>
                                        </n-button>
                                        <n-button v-if="canEdit(comment)" text size="tiny" type="error"
                                            @click="deleteComment(comment.id)">
                                            <n-icon>
                                                <Trash />
                                            </n-icon>
                                        </n-button>
                                        <n-button text size="tiny" @click="startReply(comment)">
                                            Répondre
                                        </n-button>
                                    </n-space>
                                </div>

                                <!-- reponses -->
                                <div v-if="hasReplies(comment.id)" class="replies">
                                    <n-list>
                                        <n-list-item v-for="reply in getReplies(comment.id)" :key="reply.id"
                                            class="reply-card">
                                            <div class="comment-row">
                                                <n-avatar round size="small" class="avatar">
                                                    {{ getInitials(reply.users) }}
                                                </n-avatar>
                                                <div class="comment-main">
                                                    <div class="comment-header">
                                                        <span class="author">
                                                            {{ reply.users.first_name }} {{ reply.users.last_name }}
                                                        </span>
                                                        <span class="date">{{ formatDate(reply.created_at) }}</span>
                                                    </div>
                                                    <div class="comment-content">
                                                        {{ reply.content }}
                                                    </div>
                                                    <div class="actions">
                                                        <n-space size="small">
                                                            <n-button v-if="canEdit(reply)" text size="tiny"
                                                                @click="startEdit(reply)">
                                                                <n-icon>
                                                                    <Pencil />
                                                                </n-icon>
                                                            </n-button>
                                                            <n-button v-if="canEdit(reply)" text size="tiny"
                                                                type="error" @click="deleteComment(reply.id)">
                                                                <n-icon>
                                                                    <Trash />
                                                                </n-icon>
                                                            </n-button>
                                                        </n-space>
                                                    </div>
                                                </div>
                                            </div>
                                        </n-list-item>
                                    </n-list>
                                </div>
                            </div>
                        </div>
                    </n-list-item>
                </n-list>
            </div>
        </n-scrollbar>

        <!-- formulaire -->
        <div v-if="canComment" class="comment-form">
            <n-input v-model:value="newComment" type="textarea"
                :placeholder="replyingTo ? `Réponse à ${replyingTo.users.first_name}…` : 'Ajouter un commentaire…'"
                :autosize="{ minRows: 2, maxRows: 4 }" @keydown.enter.exact.prevent="submitComment" />
            <div class="form-actions">
                <n-space justify="end">
                    <n-button v-if="replyingTo" text size="tiny" @click="cancelReply">
                        Annuler
                    </n-button>
                    <n-button type="primary" size="small" :disabled="!newComment.trim()" @click="submitComment">
                        {{ replyingTo ? 'Répondre' : 'Commenter' }}
                    </n-button>
                </n-space>
            </div>
        </div>
    </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
    NModal,
    NScrollbar,
    NList,
    NListItem,
    NAvatar,
    NInput,
    NButton,
    NSpace,
    NIcon,
    useMessage
} from 'naive-ui'
import { Pencil, Trash, Checkmark } from '@vicons/ionicons5'
import axios from '@/utils/axiosIntance.js'

const props = defineProps({
    tournament: Object,
    user: Object,
    participant: Object,
    show: Boolean
})
const emit = defineEmits(['update:show', 'update-comment-count'])

const showModal = computed({
    get: () => props.show,
    set: v => emit('update:show', v)
})

const message = useMessage()
const comments = ref([])
const newComment = ref('')
const replyingTo = ref(null)
const editingComment = ref(null)
const editingContent = ref('')

const canComment = computed(() => !!props.user && !!props.participant)
const canEdit = c => props.user && c.user_id === props.user.id
const isEditing = id => editingComment.value?.id === id

function getInitials(user) {
    if (!user) return ''
    return (
        user.first_name?.[0]?.toUpperCase() +
        user.last_name?.[0]?.toUpperCase()
    )
}

const topComments = computed(() =>
    comments.value.filter(c => c.parent_comment_id === null)
)

async function loadComments() {
    try {
        const { data } = await axios.get(
            `/tournaments/${props.tournament.id}/comments`
        )
        comments.value = data
    } catch {
        message.error('Impossible de charger les commentaires')
    }
}

function formatDate(d) {
    return new Date(d).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function hasReplies(id) {
    return comments.value.some(c => c.parent_comment_id === id)
}
function getReplies(id) {
    return comments.value
        .filter(c => c.parent_comment_id === id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

function startReply(c) {
    replyingTo.value = c
    newComment.value = ''
}
function cancelReply() {
    replyingTo.value = null
    newComment.value = ''
}
function startEdit(c) {
    editingComment.value = c
    editingContent.value = c.content
}
async function saveEdit() {
    try {
        const { data } = await axios.put(
            `/comments/${editingComment.value.id}`,
            { content: editingContent.value }
        )
        const i = comments.value.findIndex(x => x.id === data.id)
        if (i >= 0) comments.value[i] = data
        message.success('Commentaire mis à jour')
        editingComment.value = null
    } catch {
        message.error('Échec de la mise à jour')
    }
}
async function deleteComment(id) {
    try {
        await axios.delete(`/comments/${id}`)
        comments.value = comments.value.filter(c => c.id !== id)
        message.success('Commentaire supprimé')
        emit('update-comment-count', topComments.value.length)
    } catch {
        message.error('Échec de la suppression')
    }
}
async function submitComment() {
    if (!newComment.value.trim()) return
    try {
        const payload = {
            content: newComment.value,
            parent_comment_id: replyingTo.value?.id || null
        }
        const { data } = await axios.post(
            `/tournaments/${props.tournament.id}/comments`,
            payload
        )
        comments.value.push(data)
        message.success(replyingTo.value ? 'Réponse envoyée' : 'Commentaire ajouté')
        newComment.value = ''
        replyingTo.value = null
        emit('update-comment-count', topComments.value.length)
    } catch {
        message.error('Échec de l’envoi')
    }
}

watch(
    () => props.show,
    show => {
        if (show) loadComments()
        else {
            newComment.value = ''
            replyingTo.value = null
            editingComment.value = null
        }
    }
)
</script>

<style scoped>
.comments-modal {
    --n-modal-padding: 16px;
}

.comments-container {
    padding: 8px;
}

.empty-state {
    text-align: center;
    color: #888;
}

.empty-state img {
    width: 100px;
    opacity: 0.5;
    margin-bottom: 8px;
}

.empty-state p {
    font-size: 0.95em;
}

.comment-card {
    margin-bottom: 8px;
    padding: 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reply-card {
    margin-bottom: 6px;
    padding: 8px;
    border-radius: 10px;
    background: #f9f9f9;
}

.comment-row {
    display: flex;
    gap: 10px;
}

.avatar {
    flex-shrink: 0;
    background-color: #5a8dee;
    color: white;
    font-weight: bold;
}

.comment-main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85em;
    margin-bottom: 6px;
}

.author {
    font-weight: 600;
    color: #333;
}

.date {
    color: #999;
}

.comment-content,
.edit-input {
    max-height: 4em;
    overflow-y: auto;
    line-height: 1.4;
    margin-bottom: 6px;
    font-size: 0.95em;
    color: #444;
}

.actions {
    align-self: flex-end;
}

.replies {
    margin-left: 42px;
    margin-top: 4px;
}

.comment-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #eee;
}

.form-actions {
    text-align: right;
}
</style>