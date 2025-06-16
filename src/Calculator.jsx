import React, { useState, useEffect } from 'react';

const Calculator = ({ colors }) => { // Pass the colors prop
  const initialData = [
    { category: "KWILA EXTERNAL", items: [] },
    {
      category: "STAIR",
      items: [
        { name: "NUMBER OF RISERS", quantity: 13, cost: 0 },
        { name: "SUPPLY ONLY", quantity: 0, cost: 250 },
        { name: "PRIVATE", quantity: 1, cost: 1500 },
        { name: "BUILDER", quantity: 0, cost: 1200 },
        { name: "STAIR COST", quantity: 14, cost: 220 },
        { name: "EXTRA WIDTH /100mm", quantity: 0, cost: 20 },
        { name: "OPEN RISER", quantity: 1, cost: 500 },
        { name: "QUARTER LANDING", quantity: 0, cost: 800 },
        { name: "FULL LANDING", quantity: 0, cost: 1000 },
        { name: "2 WINDER", quantity: 0, cost: 1000 },
        { name: "3 WINDER", quantity: 1, cost: 1000 },
        { name: "LANDING/WINDER POST", quantity: 0, cost: 40 },
        { name: "D-STEP", quantity: 0, cost: 120 },
        { name: "REMOVE AND DISPOSE", quantity: 0, cost: 100 },
        { name: "EXTRAS REQUIRED", quantity: 3, cost: 100 },
        { name: "FOOTINGS", quantity: 5, cost: 150 },
        { name: "TRAVEL", quantity: 0, cost: 100 },
      ],
    },
    {
      category: "BALUSTRADE",
      items: [
        { name: "NEWEL POSTS", quantity: 4, cost: 150 },
        { name: "PINE 2 RAIL", quantity: 0, cost: 190 },
        { name: "PNE 3 RAIL", quantity: 0, cost: 200 },
        { name: "HARDWOOD 2 RAIL", quantity: 0, cost: 240 },
        { name: "HARDWOOD 3 RAIL", quantity: 0, cost: 220 },
        { name: "DOWEL", quantity: 5.5, cost: 280 },
        { name: "HANDRAIL ON BRACKETS", quantity: 0, cost: 20 },
        { name: "BRACKETS", quantity: 0, cost: 20 },
        { name: "CONTINUOUS RAIL MITRES", quantity: 0, cost: 50 },
        { name: "FEATURES / POST TOPS", quantity: 0, cost: 50 },
        { name: "SAWTOOTH BALUSTRADE", quantity: 0, cost: 300 },
        { name: "DIMINISH BALUSTRADE", quantity: 0, cost: 250 },
        { name: "REMOVE AND DISPOSE", quantity: 0, cost: 100 },
        { name: "EXTRAS", quantity: 0, cost: 100 },
        { name: "SS GLASS EXTRAS", quantity: 1, cost: 3950 },
        { name: "DEDUCT SS GLASS EXTRAS", quantity: 1, cost: -3050 },
      ],
    },
  ];

  const [data, setData] = useState(initialData);
  const [totals, setTotals] = useState({ subTotal: 0, gst: 0, total: 0 });

  useEffect(() => {
    calculateSubtotals(); // Calculate on initial load
  }, []);

  const calculateSubtotals = () => {
    let newSubTotal = 0;
    initialData.forEach(category => {
      category.items.forEach(item => {
        newSubTotal += item.quantity * item.cost;
      });
    });

    const newGST = newSubTotal * 0.1;
    const newTotal = newSubTotal + newGST;

    setTotals({
      subTotal: newSubTotal,
      gst: newGST,
      total: newTotal,
    });
  };

  const handleQuantityChange = (categoryIndex, itemIndex, newQuantity) => {
    const parsedQuantity = parseFloat(newQuantity);

    if (newQuantity === "") {
      // If the input is empty, default to empty string
      const newData = data.map((category, catIndex) => {
        if (catIndex === categoryIndex) {
          return {
            ...category,
            items: category.items.map((item, itemIndex2) => {
              if (itemIndex2 === itemIndex) {
                return { ...item, quantity: "" };
              }
              return item;
            }),
          };
        }
        return category;
      });
      setData(newData);
    }
    else if (isNaN(parsedQuantity)) {
      alert("Please enter a valid number for the quantity.");
      return;
    }
    else {
      const newData = data.map((category, catIndex) => {
        if (catIndex === categoryIndex) {
          return {
            ...category,
            items: category.items.map((item, itemIndex2) => {
              if (itemIndex2 === itemIndex) {
                return { ...item, quantity: parsedQuantity };
              }
              return item;
            }),
          };
        }
        return category;
      });
      setData(newData);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4" style={{ color: colors.oxfordBlue }}>Calculator</h1>
      {data.map((category, categoryIndex) => (
        <div key={categoryIndex} className="mb-6">
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.oxfordBlue }}>{category.category}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-600" style={{ backgroundColor: colors.yinmnBlue, color: colors.platinum }}>
              <thead>
                <tr style={{ backgroundColor: colors.silverLakeBlue, color: colors.richBlack }}>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Cost</th>
                  <th className="px-4 py-2">Sub Total</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item, itemIndex) => (
                  <tr key={itemIndex} className="border-t border-gray-600" style={{ color: colors.platinum }}>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-24 px-2 py-1"
                        style={{ backgroundColor: colors.richBlack, color: colors.platinum, border: `1px solid ${colors.silverLakeBlue}` }}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(categoryIndex, itemIndex, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">{item.cost}</td>
                    <td className="px-4 py-2">{item.quantity * item.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="mt-6" style={{ color: colors.platinum }}>
        <h2 className="text-xl font-semibold" style={{ color: colors.oxfordBlue }}>Totals</h2>
        <p>Sub Total: {totals.subTotal}</p>
        <p>GST: {totals.gst}</p>
        <p>Total: {totals.total}</p>
      </div>
    </div>
  );
};

export default Calculator;
