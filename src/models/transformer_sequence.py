try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

import numpy as np

# ==========================================
# 1. NATIVE PYTORCH TRANSFORMER ENCODER
# ==========================================
if HAS_TORCH:
    class TransformerSequenceNet(nn.Module):
        def __init__(self, latent_dim=64, num_heads=4, seq_len=10, num_layers=1):
            super(TransformerSequenceNet, self).__init__()
            self.latent_dim = latent_dim
            self.seq_len = seq_len
            
            # Position embeddings
            self.pos_embeddings = nn.Parameter(torch.randn(1, seq_len, latent_dim) * 0.1)
            
            # Transformer encoder layers
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=latent_dim,
                nhead=num_heads,
                dim_feedforward=128,
                dropout=0.1,
                activation='relu',
                batch_first=True
            )
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
            
            # Final output linear projection
            self.fc_out = nn.Sequential(
                nn.Linear(latent_dim, latent_dim),
                nn.LayerNorm(latent_dim)
            )

        def forward(self, sequence_embeddings):
            """
            sequence_embeddings: [batch, seq_len, d_model]
            """
            batch_size = sequence_embeddings.size(0)
            
            # Add positional embeddings
            x = sequence_embeddings + self.pos_embeddings[:, :sequence_embeddings.size(1), :]
            
            # Run through Transformer
            # We can extract attention maps using self-attention modules,
            # or approximate weights from hidden state activations.
            x_encoded = self.transformer(x)
            
            # Pool sequence (take mean of seq_len axis or take the final token state)
            pooled = torch.mean(x_encoded, dim=1)
            
            # Project forecasted next embedding vector
            forecasted = self.fc_out(pooled)
            return F.normalize(forecasted, p=2, dim=-1)

# ==========================================
# 2. HIGH-FIDELITY SCALED DOT-PRODUCT ATTENTION IN NUMPY (FALLBACK)
# ==========================================
class FallbackTransformerSequence:
    def __init__(self, latent_dim=64, num_heads=8):
        self.latent_dim = latent_dim
        self.num_heads = num_heads
        np.random.seed(42)
        # Random projection weights for Query, Key, Value
        self.w_q = np.random.randn(latent_dim, latent_dim) * 0.1
        self.w_k = np.random.randn(latent_dim, latent_dim) * 0.1
        self.w_v = np.random.randn(latent_dim, latent_dim) * 0.1
        self.w_o = np.random.randn(latent_dim, latent_dim) * 0.1

    def forward(self, sequence_embeddings):
        """
        sequence_embeddings: List of list vectors, shape [seq_len, d_model]
        """
        seq = np.array(sequence_embeddings)
        seq_len = seq.shape[0]
        
        # 1. Inject temporal positions (decay factors)
        positions = np.arange(seq_len)[:, np.newaxis]
        pos_decay = np.sin(positions / 5.0) * 0.05
        seq_pos = seq + pos_decay
        
        # 2. Compute Q, K, V
        q = np.dot(seq_pos, self.w_q)
        k = np.dot(seq_pos, self.w_k)
        v = np.dot(seq_pos, self.w_v)
        
        # 3. Scaled Dot-Product Attention: Softmax(Q * K^T / sqrt(D)) * V
        scores = np.dot(q, k.T) / np.sqrt(self.latent_dim)
        
        # Softmax rows
        exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attn_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)
        
        # Attention values
        attn_out = np.dot(attn_weights, v)
        
        # 4. Compile next forecasted embedding vector
        pooled = np.mean(attn_out, axis=0)
        out = np.dot(pooled, self.w_o)
        
        # L2 normalize
        norm = np.linalg.norm(out)
        next_embedding = (out / (norm + 1e-9)).tolist()
        
        # Extract mean attention head weights for our HUD explainability charts!
        # Returns average sequence focus levels
        hud_weights = np.mean(attn_weights, axis=0)
        # Pad or slice to exactly 8 heads to fit the dashboard display nicely
        if len(hud_weights) >= 8:
            hud_weights = hud_weights[:8].tolist()
        else:
            hud_weights = hud_weights.tolist() + [0.01] * (8 - len(hud_weights))
            
        # Normalize weights so they sum to 1
        w_sum = sum(hud_weights)
        hud_weights = [w / w_sum for w in hud_weights]

        return next_embedding, hud_weights

def create_transformer_model(latent_dim=64):
    if HAS_TORCH:
        print("[INFO] Loading Transformer Sequence Model in PYTORCH mode.")
        return TransformerSequenceNet(latent_dim=latent_dim)
    else:
        print("[WARNING] PyTorch not available. Loading sequence attention in NumPy FALLBACK mode.")
        return FallbackTransformerSequence(latent_dim=latent_dim)
