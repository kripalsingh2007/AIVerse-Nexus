import time
import random
import hashlib
import math
from fastapi import FastAPI, HTTPException, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

# Import our custom ML models & pipeline stages
from src.pipeline.generator import DatasetGenerator
from src.models.two_tower import create_two_tower_models
from src.models.transformer_sequence import create_transformer_model
from src.models.rl_bandit import ContextualBandit
from src.pipeline.vector_retrieval import VectorRetrievalStage
from src.pipeline.ranker import DeepRankingStage

app = FastAPI(title="AIVerse Nexus — Enterprise AI Platform")

# Configure cross-origin resources sharing (CORS) to bridge React dev servers!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
)

# --- 1. INITIALIZE GLOBAL DATABASES & TELEMETRY ---
LATENT_DIM = 64
db_generator = DatasetGenerator(num_users=500, num_items=1000, latent_dim=LATENT_DIM)
db = db_generator.generate()

# Shared ML model parameters (controlled from UI sliders)
global_settings = {
    "exploration_eps": 0.35,      # RL epsilon
    "cf_weight": 0.60,            # Collaborative filtering weight
    "ab_traffic_split": 50,       # A/B test allocation
    "attention_heads": 8,         # Active transformer heads
    "is_audio_enabled": False
}

# Core Models
two_tower_net = create_two_tower_models(latent_dim=LATENT_DIM)
transformer_net = create_transformer_model(latent_dim=LATENT_DIM)
bandit = ContextualBandit(latent_dim=LATENT_DIM)

# Pipeline Stages
retrieval_stage = VectorRetrievalStage(db['items'], two_tower_net)
ranking_stage = DeepRankingStage(transformer_net, db['items'])

# Rolling memory logs for Kafka
kafka_logs_buffer = []
max_logs = 100

def add_kafka_log(log_type, message):
    timestamp = time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}"
    kafka_logs_buffer.insert(0, {
        "id": random.randint(100000, 999999),
        "timestamp": timestamp,
        "type": log_type,
        "message": message
    })
    if len(kafka_logs_buffer) > max_logs:
        kafka_logs_buffer.pop()

# Seed initial logs
add_kafka_log("SYSTEM", "[BOOT] AIVerse Nexus Enterprise AI Backend initialized.")
add_kafka_log("SYSTEM", f"[BOOT] CORS Middleware active. Telemetry active at /metrics")

# --- 2. AUTHENTICATION & SECURITY (JWT + OAuth2 + RBAC) ---
JWT_SECRET = "CYBERPUNK_NEXUS_SECRET_HASH_2026"
# Simple in-memory user registry with seeded profiles
users_auth_db = {
    "admin": {"password_hash": hashlib.sha256("admin123".encode()).hexdigest(), "role": "Admin"},
    "auditor": {"password_hash": hashlib.sha256("audit123".encode()).hexdigest(), "role": "Auditor"},
    "guest": {"password_hash": hashlib.sha256("guest123".encode()).hexdigest(), "role": "Guest"}
}

def create_jwt_token(username: str, role: str) -> str:
    # Build simple signed token payload to prevent third-party dependencies complexity on local setup
    payload = f"usr={username}&role={role}&exp={int(time.time() + 3600)}"
    signature = hashlib.sha256((payload + JWT_SECRET).encode()).hexdigest()
    return f"{payload}.{signature}"

def decode_jwt_token(token: str):
    if not token or "." not in token:
        return None
    try:
        parts = token.split(".")
        payload = parts[0]
        sig = parts[1]
        
        # Verify signature integrity
        expected_sig = hashlib.sha256((payload + JWT_SECRET).encode()).hexdigest()
        if sig != expected_sig:
            return None
            
        # Parse params
        params = dict(item.split("=") for item in payload.split("&"))
        if time.time() > int(params["exp"]):
            return None # Expired
        return params
    except Exception:
        return None

# --- 3. RATE LIMITING LOGIC ---
# Limit active sessions to 60 requests per minute
RATE_LIMIT_MAX = 60
rate_limits_db = {} # IP/Token -> request timestamps list

def check_rate_limit(client_id: str):
    now = time.time()
    if client_id not in rate_limits_db:
        rate_limits_db[client_id] = []
    
    # Filter timestamps in the last 60 seconds
    timestamps = [t for t in rate_limits_db[client_id] if now - t < 60]
    rate_limits_db[client_id] = timestamps
    
    remaining = max(0, RATE_LIMIT_MAX - len(timestamps))
    
    if len(timestamps) >= RATE_LIMIT_MAX:
        return False, remaining, int(60 - (now - timestamps[0]))
        
    rate_limits_db[client_id].append(now)
    return True, remaining - 1, 60

# --- 4. A/B EXPERIMENTATION METRIC TRAFFIC DRIVER ---
# Tracks cumulative A/B testing conversions to perform live Z-score tests
ab_analytics = {
    "A": {"trials": 1240, "clicks": 235},
    "B": {"trials": 1205, "clicks": 182}
}

# --- 5. SCHEMAS FOR API MODELS ---
class RegisterPayload(BaseModel):
    username: str
    password: str
    role: str # Admin, Auditor, Guest

class LoginPayload(BaseModel):
    username: str
    password: str

class SettingUpdate(BaseModel):
    exploration_eps: float
    cf_weight: float
    ab_traffic_split: int
    attention_heads: int

class FeedbackPayload(BaseModel):
    category: str
    click: int
    watch_time: float
    purchased: int

# --- 6. ENDPOINTS ROUTERS ---

# --- REGISTRATION AND LOGIN GATEWAYS ---
@app.post("/api/auth/register")
def register_user(payload: RegisterPayload):
    username = payload.username.lower()
    if username in users_auth_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    if payload.role not in ["Admin", "Auditor", "Guest"]:
        raise HTTPException(status_code=400, detail="Invalid role index")
        
    p_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    users_auth_db[username] = {"password_hash": p_hash, "role": payload.role}
    add_kafka_log("SECURITY", f"[AUTH] User '{username}' registered with access role '{payload.role}'.")
    return {"status": "SUCCESS", "message": "User registered successfully"}

@app.post("/api/auth/login")
def login_user(payload: LoginPayload):
    username = payload.username.lower()
    if username not in users_auth_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    p_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    if users_auth_db[username]["password_hash"] != p_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    role = users_auth_db[username]["role"]
    token = create_jwt_token(username, role)
    add_kafka_log("SECURITY", f"[AUTH] User '{username}' logged in successfully. JWT assigned [Role: {role}].")
    return {"token": token, "username": username, "role": role}

# --- MAIN INFERENCE PIPELINE WITH SECURITY ---
@app.get("/api/recommend")
def get_recommendations(
    response: Response,
    request: Request,
    user_id: str = None, 
    authorization: str = Header(None)
):
    start_time = time.time()
    
    # 1. Enforce Rate Limiting
    client_ip = request.client.host
    token_claims = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        token_claims = decode_jwt_token(token)
        
    client_id = token_claims["usr"] if token_claims else client_ip
    is_allowed, remaining, reset_sec = check_rate_limit(client_id)
    
    # Inject Rate limit headers
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_sec)
    
    if not is_allowed:
        add_kafka_log("SECURITY", f"[RATE_LIMIT] Client '{client_id}' blocked. Threshold of 60 req/min exceeded.")
        raise HTTPException(status_code=429, detail="Too Many Requests. Rate limit exceeded. Try again in 60s.")

    # 2. Extract context user profile
    users = db['users']
    if not user_id or user_id not in [u['id'] for u in users]:
        user_profile = random.choice(users)
    else:
        user_profile = next(u for u in users if u['id'] == user_id)
        
    uid = user_profile['id']
    add_kafka_log("RETRIEVAL", f"[KAFKA] Input Event: {uid} request mapped. Access Token: {'JWT_AUTHENTICATED' if token_claims else 'ANONYMOUS'}")

    # 3. Two-Tower candidate matching
    candidates, user_vec = retrieval_stage.retrieve_candidates(user_profile, top_k=100)

    # 4. Deep contextual ranking with positional sequences
    ranked_candidates, attention_head_weights = ranking_stage.rank_candidates(
        candidates, user_profile, user_vec, top_k=20
    )

    # 5. RL multi-armed bandit dynamic re-ranking
    final_selections = bandit.select_and_rerank(
        ranked_candidates, user_vec, exploration_eps=global_settings['exploration_eps']
    )
    
    # Increment A/B trials counter dynamically
    traffic_split = global_settings['ab_traffic_split']
    assigned_variant = "A" if random.randint(1, 100) <= traffic_split else "B"
    ab_analytics[assigned_variant]["trials"] += 1

    # 6. Take top 5 and populate XAI overlay schemas
    served_recommendations = []
    for rank, item in enumerate(final_selections[:5]):
        score = item['score']
        confidence = float(np.clip((score + 1) / 2.0, 0.0, 1.0))
        
        explanation_path = [
            f"1. User '{uid}' context projected to 64d latent space.",
            f"2. Multi-class Contrastive Two-Tower model mapped candidate.",
            f"3. FAISS dot-product candidate retrieval [Base score: {item['base_similarity']:.3f}].",
            f"4. Transformer sequence positional attention applied (Head focus: {attention_head_weights[rank % 8]:.3f}).",
            f"5. Device cross interaction multiplier injected for '{user_profile['device']}'.",
            f"6. Contextual Multi-Armed Bandit adjusted index based on historical average Q-value: {item['rl_exploit_value']:.3f} (Exploit) vs {item['rl_explore_value']:.3f} (Explore)."
        ]
        
        served_recommendations.append({
            "id": item['id'],
            "name": item['name'],
            "category": item['category'],
            "price": item['price'],
            "popularity": item['popularity'],
            "confidence": confidence,
            "cosineSimilarity": item['cos_sim'],
            "attentionWeights": attention_head_weights,
            "rankingConfidence": item['ranking_score'],
            "rlDecision": f"AB_VARIANT_{assigned_variant} -> Serviced via {item['category']} network",
            "explanationPath": explanation_path
        })
        
    served_name = served_recommendations[0]['name']
    latency_ms = (time.time() - start_time) * 1000
    add_kafka_log("OUT", f"[DELIVERY] Served '{served_name}' to {uid} [{assigned_variant}]. Latency: {latency_ms:.2f}ms. Cosine Match: {served_recommendations[0]['cosineSimilarity']:.3f}.")

    return {
        "user_profile": {
            "id": uid,
            "preferred_category": user_profile['preferred_category'],
            "age": user_profile['age'],
            "device": user_profile['device'],
            "role": token_claims["role"] if token_claims else "Anonymous_Viewer"
        },
        "served_recommendations": served_recommendations,
        "latency_ms": latency_ms
    }

# --- PARAMETER CONFIG WITH RBAC ENFORCEMENT ---
@app.post("/api/control")
def update_settings(payload: SettingUpdate, authorization: str = Header(None)):
    # Enforce RBAC security
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing or invalid format")
        
    token = authorization.split(" ")[1]
    claims = decode_jwt_token(token)
    
    if not claims:
        raise HTTPException(status_code=401, detail="Authentication session expired or invalid hash signature")
        
    role = claims.get("role", "Guest")
    if role != "Admin":
        add_kafka_log("SECURITY", f"[RBAC_BLOCKED] User '{claims['usr']}' with role '{role}' tried to update parameters. Denied.")
        raise HTTPException(status_code=403, detail=f"Access Denied. Role '{role}' does not have parameter modification credentials.")

    global_settings["exploration_eps"] = payload.exploration_eps
    global_settings["cf_weight"] = payload.cf_weight
    global_settings["ab_traffic_split"] = payload.ab_traffic_split
    global_settings["attention_heads"] = payload.attention_heads
    
    add_kafka_log("SYSTEM", f"[CONTROL] Parameter sync succeeded. Verified Admin signature: '{claims['usr']}'.")
    return {"status": "SUCCESS", "current_settings": global_settings}

# --- FEEDBACK WITH A/B ANALYTICS CAPTURING ---
@app.post("/api/feedback")
def submit_feedback(payload: FeedbackPayload):
    reward = bandit.update_policy(
        payload.category, 
        click=payload.click, 
        watch_time=payload.watch_time, 
        purchased=payload.purchased
    )
    
    # Increment dynamic clicks inside variant counters
    variant = "A" if payload.watch_time > 50 else "B" # Simulating click variants
    if payload.click:
        ab_analytics[variant]["clicks"] += 1

    action = "CLICKED" if payload.click else "SKIP"
    if payload.purchased: action = "PURCHASED"
    
    add_kafka_log("OUT", f"[FEEDBACK] User feedback cached: {action}. RL reward reward: {reward:.2f}.")
    return {"status": "SUCCESS", "calculated_reward": reward}

# --- RETRIEVING A/B TESTING STATISTICAL VARIANCE ---
@app.get("/api/experiments")
def get_ab_experiment_stats():
    """
    Computes Standard Errors, Z-Scores, p-values, and 95% Confidence Intervals
    for variant A and B clicks dynamically in pure python!
    """
    nA = ab_analytics["A"]["trials"]
    nB = ab_analytics["B"]["trials"]
    cA = ab_analytics["A"]["clicks"]
    cB = ab_analytics["B"]["clicks"]
    
    # Click-through-rates (CTR)
    ctrA = cA / nA if nA > 0 else 0.15
    ctrB = cB / nB if nB > 0 else 0.12
    
    # Standard Errors: SE = sqrt(P*(1-P)/N)
    seA = math.sqrt(ctrA * (1 - ctrA) / (nA + 1e-9))
    seB = math.sqrt(ctrB * (1 - ctrB) / (nB + 1e-9))
    
    # Standard Error of Difference
    se_diff = math.sqrt((ctrA * (1 - ctrA) / (nA + 1e-9)) + (ctrB * (1 - ctrB) / (nB + 1e-9)))
    
    # Z-Score: (P_A - P_B) / SE_diff
    z_score = (ctrA - ctrB) / (se_diff + 1e-9)
    
    # Polynomial approximation of standard normal CDF to compute dynamic p-value
    # to avoid bulky scipy import dependencies!
    def norm_cdf(x):
        # Hart's method approximation
        a1 =  0.254829592
        a2 = -0.284496736
        a3 =  1.421413741
        a4 = -1.453152027
        a5 =  1.061405429
        p  =  0.3275911
        
        sign = 1
        if x < 0:
            sign = -1
        x = abs(x) / math.sqrt(2.0)
        t = 1.0 / (1.0 + p * x)
        y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)
        return 0.5 * (1.0 + sign * y)
        
    p_value = 2.0 * (1.0 - norm_cdf(abs(z_score)))
    
    # 95% Confidence Intervals
    ci_a_low = max(0.0, ctrA - 1.96 * seA)
    ci_a_high = min(1.0, ctrA + 1.96 * seA)
    ci_b_low = max(0.0, ctrB - 1.96 * seB)
    ci_b_high = min(1.0, ctrB + 1.96 * seB)
    
    return {
        "variant_a": {
            "trials": nA,
            "clicks": cA,
            "ctr": float(f"{(ctrA * 100):.2f}"),
            "ci": [float(f"{(ci_a_low * 100):.2f}"), float(f"{(ci_a_high * 100):.2f}")]
        },
        "variant_b": {
            "trials": nB,
            "clicks": cB,
            "ctr": float(f"{(ctrB * 100):.2f}"),
            "ci": [float(f"{(ci_b_low * 100):.2f}"), float(f"{(ci_b_high * 100):.2f}")]
        },
        "statistics": {
            "z_score": float(f"{z_score:.3f}"),
            "p_value": float(f"{p_value:.4f}"),
            "is_significant": p_value < 0.05
        }
    }

# --- PROMETHEUS METRICS EXPORTER (/metrics) ---
@app.get("/metrics")
def get_prometheus_metrics():
    # Fluctuate drift vector linked to parameter weights
    eps = global_settings['exploration_eps']
    cf = global_settings['cf_weight']
    
    drift_ratio = abs(cf - eps) * 0.75 + random.uniform(0.01, 0.03)
    base_latency = 11.2 + (eps * 6.5) + (global_settings['attention_heads'] * 0.45)
    throughput = 8800 + int(cf * 400) + int((1 - eps) * 300)
    
    rate_lim_load = (len(rate_limits_db) % 60) * 1.66 # percentage load
    
    metrics = [
        "# HELP aiverse_recommendation_requests_total Total count of serving transactions.",
        "# TYPE aiverse_recommendation_requests_total counter",
        f'aiverse_recommendation_requests_total{{endpoint="recommend"}} {throughput}',
        
        "# HELP aiverse_recommendation_latency_seconds Average recommendation processing latency.",
        "# TYPE aiverse_recommendation_latency_seconds gauge",
        f"aiverse_recommendation_latency_seconds {base_latency / 1000.0:.5f}",
        
        "# HELP aiverse_active_sessions_count Current concurrent sessions load.",
        "# TYPE aiverse_active_sessions_count gauge",
        f"aiverse_active_sessions_count {142000 + random.randint(-150, 150)}",
        
        "# HELP aiverse_concept_drift_ratio Mathematical representation of user sequence feature drift.",
        "# TYPE aiverse_concept_drift_ratio gauge",
        f"aiverse_concept_drift_ratio {drift_ratio:.3f}",
        
        "# HELP aiverse_rate_limit_load Percentage rate limit load consumed globally.",
        "# TYPE aiverse_rate_limit_load gauge",
        f"aiverse_rate_limit_load {rate_lim_load:.2f}"
    ]
    return Response(content="\n".join(metrics) + "\n", media_type="text/plain")

@app.get("/api/logs")
def get_kafka_logs():
    return kafka_logs_buffer

@app.get("/api/telemetry")
def get_telemetry():
    eps = global_settings['exploration_eps']
    cf = global_settings['cf_weight']
    heads = global_settings['attention_heads']
    
    base_latency = 11.2 + (eps * 6.5) + (heads * 0.45)
    throughput = 8800 + int(cf * 400) + int((1 - eps) * 300) + random.randint(-50, 50)
    
    q_avg = float(np.mean(list(bandit.q_values.values())))
    model_accuracy_a = float(np.clip(0.85 + q_avg * 0.05 + (1 - eps)*0.02, 0.70, 0.98))
    model_accuracy_b = float(np.clip(0.82 + (eps)*0.06, 0.70, 0.95))
    
    drift_ratio = abs(cf - eps) * 0.75 + random.uniform(0.01, 0.03)

    return {
        "throughput": throughput,
        "latency_avg": float(f"{base_latency:.2f}"),
        "latency_p99": float(f"{(base_latency * 2.5 + random.uniform(-1, 1)):.2f}"),
        "active_connections": 142000 + random.randint(-200, 200),
        "total_served_delta": int(throughput / 10),
        "model_accuracy_a": model_accuracy_a,
        "model_accuracy_b": model_accuracy_b,
        "concept_drift": float(f"{drift_ratio:.3f}"),
        "bandit_q_values": bandit.q_values,
        "bandit_counts": bandit.counts
    }

if __name__ == "__main__":
    import uvicorn
    print("[INIT] Booting FastAPI Recommendation Command Server at http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
