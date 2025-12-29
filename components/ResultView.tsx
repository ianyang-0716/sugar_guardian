
import React from 'react';
import { FoodAnalysis, GIRating } from '../types';
import { speakAdvice } from '../services/geminiService';

interface ResultViewProps {
  data: FoodAnalysis;
  onBack: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ data, onBack }) => {
  const getGIColor = (rating: string) => {
    if (rating.includes('低')) return 'bg-green-100 text-green-700 border-green-500';
    if (rating.includes('中')) return 'bg-yellow-100 text-yellow-700 border-yellow-500';
    return 'bg-red-100 text-red-700 border-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="text-blue-600 text-xl font-bold flex items-center">
          ← 返回
        </button>
        <h2 className="text-2xl font-bold text-gray-800">识别结果</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-900">{data.name}</h3>
            <p className="text-gray-500 mt-1">推荐份量: {data.portionSize}</p>
          </div>
          <div className={`px-4 py-2 rounded-full border-2 font-bold text-xl ${getGIColor(data.giRating)}`}>
            {data.giRating}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="bg-blue-50 p-4 rounded-2xl text-center">
            <p className="text-gray-600 mb-1">含糖量</p>
            <p className="text-2xl font-bold text-blue-700">{data.sugarPer100g}g<span className="text-sm font-normal">/100g</span></p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl text-center">
            <p className="text-gray-600 mb-1">GI值</p>
            <p className="text-2xl font-bold text-orange-700">{data.giValue}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border-l-8 border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold text-gray-800">专家建议：</h4>
            <button 
              onClick={() => speakAdvice(data.advice)}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center"
            >
              🔊 读给我听
            </button>
          </div>
          <p className="text-xl text-gray-700 leading-relaxed">
            {data.advice}
          </p>
        </div>
      </div>

      <button 
        onClick={onBack}
        className="w-full bg-blue-600 text-white py-5 rounded-3xl text-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
      >
        我记住了，继续
      </button>
    </div>
  );
};

export default ResultView;
