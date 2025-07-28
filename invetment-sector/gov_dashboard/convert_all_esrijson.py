import geopandas as gpd
import os

# مجلد البيانات
input_dir = 'static/data'
output_dir = 'static/data'

# قائمة الملفات (تعديل حسب الأسماء الفعلية)
files = [
    "police.json",
    "post_offices.json",
    "civil_defense.json",
    "transportation_services.json",
    "real_estate_registry.json",
    "centrals.json",
    "government_agencies.json",
    "nursing_home.json",
    "local_centers.json"
]

# تحويل كل ملف
for filename in files:
    input_path = os.path.join(input_dir, filename)
    
    # اسم الملف الجديد بعد التحويل
    name_only = os.path.splitext(filename)[0]
    output_path = os.path.join(output_dir, f"{name_only}_fixed.json")

    try:
        print(f"🔄 جاري تحويل: {filename}")
        gdf = gpd.read_file(input_path)
        gdf.to_file(output_path, driver="GeoJSON")
        print(f"✅ تم الحفظ: {output_path}")
    except Exception as e:
        print(f"❌ فشل تحويل {filename}: {e}")
