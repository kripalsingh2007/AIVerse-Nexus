try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

import numpy as np

# ==========================================
# 1. NATIVE PYTORCH TWO-TOWER IMPLEMENTATION
# ==========================================
if HAS_TORCH:
    class UserTower(nn.Module):
        def __init__(self, num_devices=3, age_dim=5, latent_dim=64):
            super(UserTower, self).__init__()
            # Map categorical age & device features into tiny embedding blocks
            self.age_embed = nn.Embedding(age_dim + 1, 8)
            self.device_embed = nn.Embedding(num_devices + 1, 8)
            
            # Linear projection layer
            # Latent input (64) + age embed (8) + device embed (8) = 80 inputs
            self.net = nn.Sequential(
                nn.Linear(latent_dim + 8 + 8, 128),
                nn.ReLU(),
                nn.Linear(128, latent_dim),
                nn.LayerNorm(latent_dim)
            )

        def forward(self, base_embedding, age_idx, device_idx):
            # Embed features
            age_feat = self.age_embed(age_idx)
            dev_feat = self.device_embed(device_idx)
            
            # Cat together
            x = torch.cat([base_embedding, age_feat, dev_feat], dim=-1)
            # Project to shared space and normalize to unit hypersphere
            user_vectors = self.net(x)
            return F.normalize(user_vectors, p=2, dim=-1)

    class ItemTower(nn.Module):
        def __init__(self, num_categories=4, latent_dim=64):
            super(ItemTower, self).__init__()
            self.cat_embed = nn.Embedding(num_categories + 1, 8)
            
            # Latent input (64) + category embed (8) = 72 inputs
            self.net = nn.Sequential(
                nn.Linear(latent_dim + 8, 128),
                nn.ReLU(),
                nn.Linear(128, latent_dim),
                nn.LayerNorm(latent_dim)
            )

        def forward(self, base_embedding, cat_idx):
            cat_feat = self.cat_embed(cat_idx)
            x = torch.cat([base_embedding, cat_feat], dim=-1)
            item_vectors = self.net(x)
            return F.normalize(item_vectors, p=2, dim=-1)

    class TwoTowerNet(nn.Module):
        def __init__(self, latent_dim=64):
            super(TwoTowerNet, self).__init__()
            self.user_tower = UserTower(latent_dim=latent_dim)
            self.item_tower = ItemTower(latent_dim=latent_dim)
            
        def forward(self, user_emb, user_age, user_dev, item_emb, item_cat):
            u_vectors = self.user_tower(user_emb, user_age, user_dev)
            i_vectors = self.item_tower(item_emb, item_cat)
            # Similarity is dot product (cosine similarity since vectors are unit L2 normalized)
            similarity = torch.sum(u_vectors * i_vectors, dim=-1)
            return similarity

        def compute_contrastive_loss(self, u_vecs, i_vecs, temperature=0.07):
            """
            Computes InfoNCE Contrastive Loss across a batch
            """
            # Similarity matrix [B, B]
            logits = torch.matmul(u_vecs, i_vecs.T) / temperature
            # Diagonal holds correct pairs (batch index matches itself)
            batch_size = u_vecs.size(0)
            labels = torch.arange(batch_size, device=u_vecs.device)
            # Cross entropy makes matching elements on diagonal have high score
            loss = F.cross_entropy(logits, labels)
            return loss

# ==========================================
# 2. ROBUST NUMPY COMPATIBLE FALLBACK
# ==========================================
class FallbackUserTower:
    def __init__(self, latent_dim=64):
        self.latent_dim = latent_dim
        # Seed random weights for linear mappings
        np.random.seed(42)
        self.w1 = np.random.randn(latent_dim + 16, 128) * 0.1
        self.b1 = np.zeros(128)
        self.w2 = np.random.randn(128, latent_dim) * 0.1
        self.b2 = np.zeros(latent_dim)

    def forward(self, base_embedding, age_idx, device_idx):
        # Base vector
        emb = np.array(base_embedding)
        
        # Simulated categorical embeddings via simple hash functions
        age_hash = np.sin(np.arange(8) * (age_idx + 1)) * 0.5
        dev_hash = np.cos(np.arange(8) * (device_idx + 1)) * 0.5
        
        x = np.concatenate([emb, age_hash, dev_hash], axis=-1)
        
        # Dense linear 1
        h = np.dot(x, self.w1) + self.b1
        h = np.maximum(h, 0) # ReLU
        
        # Dense linear 2
        out = np.dot(h, self.w2) + self.b2
        # L2 normalize
        norm = np.linalg.norm(out)
        return (out / (norm + 1e-9)).tolist()

class FallbackItemTower:
    def __init__(self, latent_dim=64):
        self.latent_dim = latent_dim
        np.random.seed(42)
        self.w1 = np.random.randn(latent_dim + 8, 128) * 0.1
        self.b1 = np.zeros(128)
        self.w2 = np.random.randn(128, latent_dim) * 0.1
        self.b2 = np.zeros(latent_dim)

    def forward(self, base_embedding, cat_idx):
        emb = np.array(base_embedding)
        cat_hash = np.sin(np.arange(8) * (cat_idx + 1)) * 0.5
        
        x = np.concatenate([emb, cat_hash], axis=-1)
        
        h = np.dot(x, self.w1) + self.b1
        h = np.maximum(h, 0)
        
        out = np.dot(h, self.w2) + self.b2
        norm = np.linalg.norm(out)
        return (out / (norm + 1e-9)).tolist()

# Wrapper initializer
def create_two_tower_models(latent_dim=64):
    if HAS_TORCH:
        print("[INFO] Loading Two-Tower Model in PYTORCH mode.")
        return TwoTowerNet(latent_dim=latent_dim)
    else:
        print("[WARNING] PyTorch not available. Launching Two-Tower in NumPy FALLBACK mode.")
        class NumpyTwoTowerNet:
            def __init__(self):
                self.user_tower = FallbackUserTower(latent_dim=latent_dim)
                self.item_tower = FallbackItemTower(latent_dim=latent_dim)
            def similarity(self, u_vec, i_vec):
                return float(np.dot(np.array(u_vec), np.array(i_vec)))
        return NumpyTwoTowerNet()
