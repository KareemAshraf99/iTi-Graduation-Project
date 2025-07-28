import os
import shutil
import pandas as pd
from flask import Flask, render_template, request, send_file
import geopandas as gpd
import folium
from pyproj import CRS

# تعطيل تحذيرات SettingWithCopyWarning (اختياري)
pd.options.mode.chained_assignment = None

# ====== Geospatial Analysis Section ======
base_path = os.path.dirname(os.path.abspath(__file__))

# تعريف نظام الإحداثيات
WGS84_UTM36N = CRS.from_epsg(32636)  # EPSG:32636 - WGS84 / UTM zone 36N
WGS84 = CRS.from_epsg(4326)  # WGS84 Lat/Long

# تحميل البيانات
def load_data(path):
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        gdf = gdf.set_crs(WGS84_UTM36N)
    else:
        gdf = gdf.to_crs(WGS84_UTM36N)
    return gdf

Qualyubiyah_Districts = load_data(os.path.join(base_path, 'Al_Qualyubiyah', 'حدود_المراكز.shp'))
Qualyubiyah_village = load_data(os.path.join(base_path, 'Al_Qualyubiyah', 'حدود_الشياخات.shp'))
Road = load_data(os.path.join(base_path, 'Road_data', 'Roads.shp'))
school = load_data(os.path.join(base_path, 'School_data', 'school.shp'))

# إعداد مجلد المخرجات
output_folder = os.path.join(base_path, 'final_output')
if os.path.exists(output_folder):
    shutil.rmtree(output_folder)
os.makedirs(output_folder)

# إضافة إحداثيات النقاط للمدارس
def add_coordinates(gdf):
    gdf = gdf.copy()
    if all(geom_type == 'Point' for geom_type in gdf.geometry.geom_type):
        gdf['EASTING'] = gdf.geometry.x
        gdf['NORTHING'] = gdf.geometry.y
    else:
        gdf['EASTING'] = gdf.geometry.centroid.x
        gdf['NORTHING'] = gdf.geometry.centroid.y
    return gdf

school = add_coordinates(school)

# تصنيف الأراضي الفضاء والمدارس الموجودة
empty_conditions = ["ارض فضاء", "(ج.ت.للطرح(انشاءجديد", "ج0ت0 للطرح توسع", "مغ0كلى ج.تجهيزللطرح"]
existing_conditions = ["مدرسة", "جارى الانشاء", "تعمل جزئى", "جارى اجراءمدرسة خاصة"]

lands_empty = school[school['موقف_'].isin(empty_conditions)].copy()
existing_schools = school[school['موقف_'].isin(existing_conditions)].copy()

# قص الأراضي الفضاء مع حدود القرى
lands_clipped = gpd.clip(lands_empty, Qualyubiyah_village).copy()
lands_clipped['UID'] = lands_clipped.index

# حساب المدارس القريبة
def count_nearby_schools(row, schools_gdf, radius=500):
    point = row.geometry.centroid if row.geometry.geom_type != 'Point' else row.geometry
    buffer = point.buffer(radius)
    return schools_gdf[schools_gdf.geometry.within(buffer)].shape[0]

lands_clipped['Join_Count'] = lands_clipped.apply(
    lambda row: count_nearby_schools(row, existing_schools), axis=1)
lands_clipped['NeedSchl'] = lands_clipped['Join_Count'].apply(
    lambda x: 'No' if x > 0 else 'Yes')

# تصفية الأراضي التي تحتاج مدارس
lands_need_school = lands_clipped[lands_clipped['NeedSchl'] == 'Yes'].copy()

# حساب المسافات للطرق
def calculate_nearest_distance(gdf, roads_gdf):
    def get_distance(point):
        return roads_gdf.geometry.distance(point).min()
    return gdf.geometry.centroid.apply(get_distance)

main_roads = Road[Road['d_Category'] == 'طريق رئيسي'].copy()
secondary_roads = Road[Road['d_Category'] == 'طريق ثانوي'].copy()
local_roads = Road[Road['d_Category'] == 'طريق محلي'].copy()

lands_need_school['Dist_Main'] = calculate_nearest_distance(lands_need_school, main_roads)
lands_need_school['Dist_Secondary'] = calculate_nearest_distance(lands_need_school, secondary_roads)
lands_need_school['Dist_Local'] = calculate_nearest_distance(lands_need_school, local_roads)

# تحديد الأولوية والتصنيف النهائي
def set_priority(row):
    if row['Dist_Main'] <= 100: return 1
    elif row['Dist_Secondary'] <= 150: return 2
    elif row['Dist_Local'] <= 200: return 3
    return 0

def final_rank(row):
    if row['NeedSchl'] == "No": return "لا تحتاج مدرسة"
    elif row['Priority'] == 1: return "تحتاج مدرسة - أولوية قصوى"
    elif row['Priority'] == 2: return "تحتاج مدرسة - أولوية جيدة"
    elif row['Priority'] == 3: return "تحتاج مدرسة - أولوية مقبولة"
    return "تحتاج مدرسة - غير مناسبة"

lands_need_school['Priority'] = lands_need_school.apply(set_priority, axis=1)
lands_need_school['FinalRank'] = lands_need_school.apply(final_rank, axis=1)

# إضافة معلومات المركز وحفظ النتائج
lands_with_district = gpd.sjoin(
    lands_need_school, 
    Qualyubiyah_Districts, 
    how='left', 
    predicate='intersects'
).copy()

lands_with_district['SHAPE_Area'] = lands_with_district.geometry.area.round(2)
final_output = os.path.join(output_folder, 'final_ranked_lands_with_district.gpkg')
lands_with_district.to_file(final_output, driver='GPKG')

print(f"تم حفظ الملف النهائي بنجاح: {final_output}")

# ====== Flask Application ======
app = Flask(__name__, template_folder=base_path)

DATA_PATH = final_output
CENTERS_SHP = os.path.join(base_path, "Districts1.geojson")

def get_all_centers():
    centers = gpd.read_file(CENTERS_SHP)
    return sorted(centers['SEC_NAME'].unique().tolist())

@app.route("/")
def index():
    if not os.path.exists(DATA_PATH) or not os.path.exists(CENTERS_SHP):
        return "الملفات المطلوبة غير موجودة", 500

    try:
        # إنشاء الخريطة الأساسية
        m = folium.Map(location=[30.3, 31.2], zoom_start=10, tiles='CartoDB Positron')
        
        # إضافة طبقات الخريطة
        folium.TileLayer(
            tiles='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attr='OpenStreetMap',
            name='OpenStreetMap',
            overlay=False,
            control=True
        ).add_to(m)
        
        folium.TileLayer(
            tiles='https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            attr='Google Hybrid',
            name='Hybrid Satellite',
            overlay=False,
            control=True
        ).add_to(m)

        # إضافة المدارس إذا كانت موجودة
        school_path = os.path.join(base_path, 'School_data', 'school.shp')
        if os.path.exists(school_path):
            try:
                schools_df = gpd.read_file(school_path)
                if not schools_df.empty:
                    schools_df = schools_df.to_crs("EPSG:4326")
                    schools_df['lat'] = schools_df.geometry.y
                    schools_df['long'] = schools_df.geometry.x
                    
                    schools_df = schools_df[schools_df['موقف_'].str.contains('مدرسة', na=False)]
                    
                    # تصنيف المدارس
                    def classify_stage(stage):
                        if stage in ['ابتدائى', 'أساسى', 'اعدادى']: return 'تعليم أساسي'
                        elif stage in ['ثانوى عام', 'اعدادى وثانوى']: return 'تعليم ثانوي'
                        elif stage in ['فنى تجارى', 'زراعى', 'صناعى']: return 'تعليم فني'
                        elif 'تربية خاصة' in str(stage): return 'تعليم خاص'
                        elif 'حضانة' in str(stage) or 'ثانوى' in str(stage): return 'مجمع تعليمي'
                    
                    schools_df['category'] = schools_df['المــ'].apply(classify_stage)
                    
                    # إضافة المدارس للخريطة
                    category_colors = {
                        'تعليم أساسي': 'blue',
                        'تعليم ثانوي': '#6a3d9a',
                        'تعليم فني': "#8c564b",
                        'تعليم خاص': '#468189',
                        'مجمع تعليمي': '#ff7f0e',
                    }
                    
                    schools_group = folium.FeatureGroup(name="المدارس حسب التصنيف", show=True)
                    
                    for category, color in category_colors.items():
                        for _, row in schools_df[schools_df['category'] == category].iterrows():
                            popup_text = f"""
                            <div style='width:250px;min-height:180px;font-family:Arial;font-size:15px;
                                    text-align:right;direction:rtl;color:#333;padding:10px;'>
                                <h4 style='margin:0 0 10px 0;font-size:20px;color:#0a3f77;'>
                                    التصنيف: {category}
                                </h4>
                                <p style='margin:6px 0;'><b>المرحلة:</b> {row.get('المــ', '')}</p>
                                <p style='margin:6px 0;'><b>حالة المدرسة:</b> {row.get('موقف_', '')}</p>
                            </div>
                            """
                            
                            folium.CircleMarker(
                                location=[row['lat'], row['long']],
                                radius=3,
                                color=color,
                                fill=True,
                                fill_color=color,
                                popup=folium.Popup(popup_text, max_width=500)
                            ).add_to(schools_group)
                    
                    schools_group.add_to(m)
                    
                    # إضافة وسيلة إيضاح
                    schools_legend = '''
                    <div style="position:fixed;bottom:70px;right:0;width:150px;height:200px;
                            border:2px solid grey;z-index:9999;font-size:12px;background:white;
                            padding:10px;font-family:Arial;text-align:right;">
                        <h4 style="margin-top:0;color:#333;">تصنيف المدارس:</h4>
                        <p style="margin:5px 0;"><span style="display:inline-block;width:12px;
                            height:12px;border-radius:50%;background:blue;margin-left:5px;"></span> تعليم أساسي</p>
                        <p style="margin:5px 0;"><span style="display:inline-block;width:12px;
                            height:12px;border-radius:50%;background:#6a3d9a;margin-left:5px;"></span> تعليم ثانوي</p>
                        <p style="margin:5px 0;"><span style="display:inline-block;width:12px;
                            height:12px;border-radius:50%;background:#8c564b;margin-left:5px;"></span> تعليم فني</p>
                        <p style="margin:5px 0;"><span style="display:inline-block;width:12px;
                            height:12px;border-radius:50%;background:#468189;margin-left:5px;"></span> تعليم خاص</p>
                        <p style="margin:5px 0;"><span style="display:inline-block;width:12px;
                            height:12px;border-radius:50%;background:#ff7f0e;margin-left:5px;"></span> مجمع تعليمي</p>
                    </div>
                    '''
                    m.get_root().html.add_child(folium.Element(schools_legend))
            except Exception as e:
                print(f"خطأ في تحميل بيانات المدارس: {e}")

        # تحميل وعرض بيانات الأراضي المصنفة
        df = gpd.read_file(DATA_PATH).to_crs("EPSG:4326")
        df['lat'] = df.geometry.y
        df['long'] = df.geometry.x

        selected_center = request.args.get('center')
        selected_priority = request.args.get('priority')

        if selected_center and selected_center != "الكل":
            df = df[df['SEC_NAME'] == selected_center]
        if selected_priority:
            df = df[df['FinalRank'] == selected_priority]

        # إضافة الأراضي المصنفة للخريطة
        priority_colors = {
            "تحتاج مدرسة - أولوية قصوى": "red",
            "تحتاج مدرسة - أولوية جيدة": "orange",
            "تحتاج مدرسة - أولوية مقبولة": "green",
            "تحتاج مدرسة - غير مناسبة": "gray"
        }

        for priority, color in priority_colors.items():
            priority_df = df[df['FinalRank'] == priority]
            feature_group = folium.FeatureGroup(name=priority)
            
            for _, row in priority_df.iterrows():
                popup_text = f"""
                    <div style='width: 250px; min-height: 180px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.8; text-align: right; direction: rtl; color: #333; padding: 10px;'>
                        <h4 style='margin: 0 0 10px 0; font-size: 20px; color: #0a3f77;'>المرحلة التعليمية: {row.get('المــ', '')}</h4>
                        <p style='margin: 6px 0;'><b>المركز:</b> {row.get('SEC_NAME', '')}</p>
                        <p style='margin: 6px 0;'><b>الأولوية:</b> {priority}</p>
                        <p style='margin: 6px 0;'><b>المسافة للطريق:</b> {row.get('Dist_Main', '')} م</p>
                    </div>
                    """
                
                folium.Marker(
                    location=[row['lat'], row['long']],
                    popup=folium.Popup(popup_text, max_width=500),
                    icon=folium.Icon(icon='school', prefix='fa', color='white', icon_color=color)
                ).add_to(feature_group)
                
                folium.CircleMarker(
                    location=[row['lat'], row['long']],
                    radius=5, color=color, fill=True, fill_color=color
                ).add_to(feature_group)
            
            feature_group.add_to(m)

        # إضافة حدود المراكز
        centers = gpd.read_file(CENTERS_SHP).to_crs("EPSG:4326")
        folium.GeoJson(
            centers,
            name="حدود المراكز",
            style_function=lambda x: {'color': 'black', 'fillOpacity': 0, 'weight': 1},
            tooltip=folium.GeoJsonTooltip(fields=['SEC_NAME'], aliases=['المركز'])
        ).add_to(m)

        # إضافة عناصر التحكم والوسائل الإيضاحية
        folium.LayerControl().add_to(m)
        
        priority_legend = '''
        <div style="position:fixed;bottom:90px;left:0;width:200px;height:150px;
                border:2px solid grey;z-index:9999;font-size:14px;background:white;
                padding:10px;font-family:Arial;text-align:right;">
            <h4 style="margin-top:0;color:#333;">تصنيف الأولوية:</h4>
            <p style="margin:5px 0;"><i class="fa fa-school" style="color:red;"></i> أولوية قصوى</p>
            <p style="margin:5px 0;"><i class="fa fa-school" style="color:orange;"></i> أولوية جيدة</p>
            <p style="margin:5px 0;"><i class="fa fa-school" style="color:green;"></i> أولوية مقبولة</p>
            <p style="margin:5px 0;"><i class="fa fa-school" style="color:gray;"></i> غير مناسبة</p>
        </div>
        '''
        m.get_root().html.add_child(folium.Element(priority_legend))

        # ضبط حدود الخريطة إذا تم اختيار مركز معين
        if selected_center and selected_center != "الكل" and not df.empty:
            center_bounds = centers[centers['SEC_NAME'] == selected_center].total_bounds
            m.fit_bounds([[center_bounds[1], center_bounds[0]], [center_bounds[3], center_bounds[2]]])

        # تحضير البيانات للعرض في القالب
        map_html = m._repr_html_()
        priority_counts = df['FinalRank'].value_counts().to_dict()
        center_counts = df['SEC_NAME'].value_counts().to_dict()
        
        return render_template(
            "index.html",
            map_html=map_html,
            priority_counts=priority_counts,
            center_counts=center_counts,
            table_data=df.to_dict(orient="records"),
            selected_center=selected_center,
            selected_priority=selected_priority,
            all_centers=get_all_centers(),
            filtered_centers=sorted(df['SEC_NAME'].unique().tolist()),
            avg_main_dist=round(df["Dist_Main"].mean(), 2) if "Dist_Main" in df.columns else None
        )

    except Exception as e:
        print(f"حدث خطأ: {str(e)}")
        return f"حدث خطأ: {str(e)}", 500

@app.route('/style.css')
def serve_css():
    return send_file(os.path.join(base_path, "style.css"), mimetype='text/css')

@app.route('/script.js')
def serve_js():
    return send_file(os.path.join(base_path, "script.js"), mimetype='text/javascript')

if __name__ == '__main__':
    app.run(debug=True, port=7000)