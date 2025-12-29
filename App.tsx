
import React, { useState, useEffect } from 'react';
import CameraModal from './components/CameraModal';
import ResultView from './components/ResultView';
import { analyzeFoodImage, analyzeMealImage } from './services/geminiService';
import { FoodAnalysis, MealRecord, DailyStats } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'analyze' | 'history'>('home');
  const [showCamera, setShowCamera] = useState<null | 'gi' | 'meal'>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  
  // Local daily state (in a real app, this would be persisted or from backend)
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    date: new Date().toLocaleDateString(),
    totalSugar: 0,
    limit: 50, // Standard RDA for diabetic moderate sugar intake from carbs
    meals: []
  });

  const handleCapture = async (base64: string) => {
    setLoading(true);
    const mode = showCamera;
    setShowCamera(null);

    try {
      if (mode === 'gi') {
        const result = await analyzeFoodImage(base64);
        setAnalysisResult(result);
      } else if (mode === 'meal') {
        const result = await analyzeMealImage(base64);
        const newMeal: MealRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          image: `data:image/jpeg;base64,${base64}`,
          foods: result.foods.map(f => ({ ...f, giValue: 0, advice: '', carbsPer100g: 0, portionSize: '一顿', giRating: f.giRating as any })),
          totalSugar: result.totalSugar,
          totalCarbs: result.totalCarbs,
          rating: result.totalSugar > 20 ? '需注意' : (result.totalSugar > 10 ? '良' : '优')
        };
        
        setDailyStats(prev => ({
          ...prev,
          totalSugar: prev.totalSugar + result.totalSugar,
          meals: [newMeal, ...prev.meals]
        }));
        
        alert(`这餐饭共含有糖分约 ${result.totalSugar}g，已加入今日统计。`);
      }
    } catch (error) {
      console.error(error);
      alert("识别失败，请检查网络或重试。");
    } finally {
      setLoading(false);
    }
  };

  const SugarProgress = () => {
    const percentage = Math.min((dailyStats.totalSugar / dailyStats.limit) * 100, 100);
    const colorClass = percentage > 80 ? 'bg-red-500' : 'bg-green-500';
    
    return (
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-700">今日用糖统计</h3>
          <span className="text-gray-400">{dailyStats.date}</span>
        </div>
        
        <div className="flex items-end justify-between mb-2">
          <p className="text-5xl font-black text-blue-600">
            {dailyStats.totalSugar.toFixed(1)}<span className="text-lg font-normal text-gray-500 ml-1">克</span>
          </p>
          <p className="text-gray-400 pb-2">建议上限: {dailyStats.limit}克</p>
        </div>

        <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden">
          <div 
            className={`${colorClass} h-full transition-all duration-500 ease-out`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {percentage > 90 && (
          <p className="mt-3 text-red-500 font-bold flex items-center">
            ⚠️ 今日用糖已接近上限，建议接下来的饮食要清淡。
          </p>
        )}
      </div>
    );
  };

  const HomePage = () => (
    <div className="p-4 space-y-6 pb-24">
      <header className="py-4">
        <h1 className="text-3xl font-black text-gray-900">糖友管家</h1>
        <p className="text-gray-500 text-lg">您贴心的控糖好助手</p>
      </header>

      <SugarProgress />

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowCamera('gi')}
          className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">
            🔍
          </div>
          <span className="text-xl font-bold">查GI建议</span>
        </button>
        
        <button 
          onClick={() => setShowCamera('meal')}
          className="bg-green-600 text-white p-6 rounded-3xl shadow-lg shadow-green-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">
            📸
          </div>
          <span className="text-xl font-bold">餐前拍照</span>
        </button>
      </div>

      <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-100">
        <h4 className="text-xl font-bold text-orange-800 mb-2">💡 健康小贴士</h4>
        <p className="text-lg text-orange-700 leading-relaxed">
          先吃菜，再吃肉，最后吃主食，这样可以有效减缓血糖上升速度哦！
        </p>
      </div>
    </div>
  );

  const HistoryPage = () => (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mt-4">饮食记录</h2>
      {dailyStats.meals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-300">
          <p className="text-gray-400 text-xl">今天还没有拍照记录呢</p>
        </div>
      ) : (
        dailyStats.meals.map(meal => (
          <div key={meal.id} className="bg-white rounded-3xl overflow-hidden shadow-md flex">
            <div className="w-1/3 h-32 relative">
              <img src={meal.image} className="w-full h-full object-cover" alt="Meal" />
              <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-2 py-1">
                {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg text-gray-800">
                  {meal.foods.length > 0 ? meal.foods.map(f => f.name).join(', ') : '正餐记录'}
                </h4>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  meal.rating === '优' ? 'bg-green-100 text-green-700' : 
                  meal.rating === '良' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                }`}>
                  {meal.rating}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {meal.totalSugar.toFixed(1)}g <span className="text-sm font-normal text-gray-400">糖分</span>
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-neutral-50 flex flex-col relative pb-20">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/90 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-2xl font-bold text-gray-800">正在聪明地识别中...</p>
          <p className="text-gray-500 mt-2">请稍等，大模型助手正在为您分析营养成分</p>
        </div>
      )}

      {showCamera && (
        <CameraModal 
          title={showCamera === 'gi' ? "拍照查GI建议" : "餐前拍全景照"}
          onClose={() => setShowCamera(null)}
          onCapture={handleCapture}
        />
      )}

      {analysisResult ? (
        <ResultView 
          data={analysisResult} 
          onBack={() => setAnalysisResult(null)} 
        />
      ) : (
        <>
          {activeTab === 'home' && <HomePage />}
          {activeTab === 'history' && <HistoryPage />}

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 h-20 flex items-center justify-around z-40 px-6 pb-4">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <span className="text-2xl">🏠</span>
              <span className="text-sm font-bold">主页</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <span className="text-2xl">📊</span>
              <span className="text-sm font-bold">记录</span>
            </button>
            <button 
              onClick={() => {
                const helpText = "我是您的控糖管家。您可以点击主页的蓝色按钮识别单种食物，或者点击绿色按钮拍摄整顿饭来统计全天的糖分。如果您看不清字，可以点击读给我听。";
                alert("使用帮助: " + helpText);
              }}
              className="flex flex-col items-center space-y-1 text-gray-400"
            >
              <span className="text-2xl">❓</span>
              <span className="text-sm font-bold">帮助</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};

export default App;
