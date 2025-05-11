# python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.responses import JSONResponse
from embedding import create_embedding

app = FastAPI()

# Load clothes data with embeddings
with open("data/clothes.json", "r", encoding="utf-8") as f:
    CLOTHES = json.load(f)

# Parse embedding to numpy
for item in CLOTHES:
    item["embedding"] = np.array(item["embedding"])

# === Request model ===
class CategoryInput(BaseModel):
    parent: str
    child: List[str]

class ClothingItemInput(BaseModel):
    id: str
    name: str
    imageUrl: str
    category: CategoryInput
    season: List[str]
    occasion: List[str]
    color: List[str]
    material: List[str]
    pattern: List[str]
    style: List[str]
    gender: str  
    embedding: List[float]

class OutfitRequest(BaseModel):
    selectedStyle: Optional[str]
    selectedOccasion: Optional[str]
    temperatureLow: Optional[float]
    temperatureHigh: Optional[float]
    personalColor: Optional[str]
    bodyType: Optional[str]
    location: Optional[str]
    when: Optional[str]
    clothes: List[ClothingItemInput]


# === Response model ===
class ClothingItem(BaseModel):
    id: str
    name: str
    imageUrl: str

class OutfitResponse(BaseModel):
    outfits: List[List[ClothingItem]]  # Trả về danh sách các outfit (mỗi outfit là 1 list quần áo)


def fix_category(category):
    if not category.parent:
        category.parent = 'other'  # Giá trị mặc định hợp lệ
    if category.parent == 'orther':  # Sửa lỗi chính tả
        category.parent = 'other'
    if not category.child:
        category.child = ['default']  # Cung cấp giá trị mặc định cho child nếu cần
    return category

def fix_gender(gender):
    if not gender:
        return 'unisex'  # Giá trị mặc định khi không có gender
    return gender

def fix_embedding(item, embedding_dim=128):
    if not item.embedding:  # Nếu không có embedding, đặt mặc định là mảng 0
        item.embedding = [0.0] * embedding_dim  # Giả sử embedding có 128 chiều
    elif len(item.embedding) != embedding_dim:  # Nếu embedding không đúng chiều, chuẩn hóa lại
        item.embedding = item.embedding[:embedding_dim] + [0.0] * (embedding_dim - len(item.embedding))
    return item


# === Gợi ý outfit ===
@app.post("/suggest-outfit", response_model=OutfitResponse)
def suggest_outfit(req: OutfitRequest):
    try:
        print(f"Received clothes: {req.clothes}")  # Log dữ liệu quần áo nhận được
        clothes = req.clothes
        if not clothes:
            raise HTTPException(status_code=400, detail="No clothes provided")
        
        # Sửa dữ liệu quần áo
        for item in clothes:
            item.category = fix_category(item.category)
            item.gender = fix_gender(item.gender)
            item = fix_embedding(item)  # Đảm bảo embedding hợp lệ

        # Tạo embedding cho item quần áo
        embeddings = [create_embedding(item.dict()) for item in clothes]
        user_embedding = np.mean(embeddings, axis=0).reshape(1, -1)

        similarities = []
        for item in clothes:
            item_vec = create_embedding(item.dict()).reshape(1, -1)
            sim = cosine_similarity(user_embedding, item_vec)[0][0]
            similarities.append((item, sim))


        similarities.sort(key=lambda x: x[1], reverse=True)

        category_groups = {}
        for item, score in similarities:
            parent = item.category.parent.lower()
            # Chuẩn hóa tên danh mục về dạng preferred
            parent_mapping = {
                "tops": "top",
                "pants": "bottom",
                "shoes": "shoes",
                "bag": "bag",
                "accessories": "accessory",
                "accessory": "accessory",
                "outerwear": "top",   # Áo khoác cũng là top
                "headwear": "accessory",
                "jewelry": "accessory",
                "other": "accessory",
            }
            cat = parent_mapping.get(parent, "accessory")  # Mặc định là 'accessory'
            if cat not in category_groups:
                category_groups[cat] = []
            category_groups[cat].append(item)
        print("Category groups:", {k: [i.name for i in v] for k, v in category_groups.items()})

        preferred_order = ["top", "bottom", "shoes", "bag", "accessory"]
        outfit_count = 3
        outfits = []

        # Sửa đoạn mã này để kiểm tra xem 'items' có tồn tại hay không trước khi truy cập
        for i in range(outfit_count):
            outfit = []
            for cat in preferred_order:
                items = category_groups.get(cat, [])  # Đảm bảo rằng 'items' luôn là danh sách, nếu không sẽ là danh sách rỗng
                if items:  # Kiểm tra nếu có ít nhất 1 item trong danh sách
                    outfit.append(items[min(i, len(items)-1)])  # Thêm item vào outfit, đảm bảo không vượt quá số lượng items
            outfits.append(outfit)

        print(f"Generated outfits (response): {[[item.name for item in outfit] for outfit in outfits]}")
        return {"outfits": outfits}


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
