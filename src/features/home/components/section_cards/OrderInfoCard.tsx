import React from "react";

interface OrderDetailsProps {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  expectedArrival: string;
  deliveryAfter?: string;
  deliveryBefore?: string;
  language?: string;
}

export const OrderDetailsPill: React.FC<{ details: OrderDetailsProps }> = ({ details }) => {
  const { clientName, clientAddress, clientPhone, expectedArrival, deliveryAfter, deliveryBefore, language } = details
  return (
    <div className="w-[400px] bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-6 text-[15px]">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Client</p>
        <p className="font-semibold text-gray-900">{clientName}</p>
        <p className="text-sm text-gray-500">{clientAddress}</p>
        <p className="text-sm text-gray-500">{clientPhone}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Delivery Window</p>
        <p className="text-sm text-gray-700">{expectedArrival}</p>
        <p className="text-sm text-gray-500">
          {deliveryAfter ? `After ${deliveryAfter}` : 'Flexible start'} · {deliveryBefore ? `Before ${deliveryBefore}` : 'Flexible end'}
        </p>
      </div>
      {language && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Language</p>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold uppercase">
            {language}
          </span>
        </div>
      )}
    </div>
  );
};
