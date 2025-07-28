document.addEventListener('DOMContentLoaded', function() {
    const priorityData = JSON.parse(document.getElementById('priority-data').textContent);
    const centerData = JSON.parse(document.getElementById('center-data').textContent);
            
    // تصفية بيانات الأولوية وإعداد الألوان الثابتة
    const filteredPriorityData = {};
    const priorityColors = {};
            
    Object.keys(priorityData).forEach(key => {
        if (key.includes("تحتاج مدرسة"))  {
            filteredPriorityData[key] = priorityData[key];
                    
        // تعيين الألوان حسب نوع الأولوية
        if (key.includes("قصوى")) {
            priorityColors[key] = '#d6352f'; } 
        else if (key.includes("جيدة")) {
            priorityColors[key] = '#f0ad4e'; }   
        else if (key.includes("مقبولة")) {
            priorityColors[key] = '#5bde75'; } 
        else {
            priorityColors[key] = '#aaabab'; }}});
            
       // إنشاء مصفوفة الألوان بنفس ترتيب التسميات
    const backgroundColors = Object.keys(filteredPriorityData).map(key => priorityColors[key]);
    // مخطط الأولويات (دائري)
    new Chart(
        document.getElementById('priorityChart'),
        {
            type: 'pie',
            data: {
                labels: Object.keys(filteredPriorityData),
                datasets: [{
                    data: Object.values(filteredPriorityData),
                    backgroundColor: backgroundColors,
                    borderWidth: 1}]},
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            rtl: true},
                        tooltip: {
                            rtl: true,
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} موقع`;}}}}}});
            
    // مخطط المراكز (شريطي أفقي)
    new Chart(
        document.getElementById('centerChart'),
        {
            type: 'bar',
            data: {
                labels: Object.keys(centerData),
                datasets: [{
                    label: 'عدد المواقع',
                    data: Object.values(centerData),
                    backgroundColor: '#0a3f77',
                    borderColor: '#1f2020',
                    borderWidth: 1}]},
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false},
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} موقع`;}}}},
                scales: {
                    x: {
                        beginAtZero: true}}}});

            // إدارة تحميل الملفات
    const fileUploadInput = document.getElementById('file-upload');
    const fileUploadLabel = document.querySelector('label[for="file-upload"]');
            
    fileUploadInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileUploadLabel.innerHTML = `<i class="fas fa-check"></i> ${this.files[0].name}`;}});

            // عرض تنبيه عند محاولة تحميل ملف
    document.getElementById('uploadForm').addEventListener('submit', function(e) {
        if (!fileUploadInput.files.length) {
            e.preventDefault();
            alert('الرجاء اختيار ملف أولاً');}});});