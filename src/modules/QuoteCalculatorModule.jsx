// src/modules/QuoteCalculatorModule.jsx (Corrected)
import React, { useState, useEffect, useRef, useContext } from "react";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    orderBy, 
    deleteDoc, 
    doc, 
    setDoc,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const partsList = [
    { isTitle: true, name: "Stair", section: "stair" }, { name: "SUPPLY ONLY", id: "supplyonly", section: "stair" }, { name: "PRIVATE", id: "private", section: "stair" }, { name: "BUILDER", id: "builder", section: "stair" }, { name: "STAIR COST", id: "staircost", section: "stair" }, { name: "EXTRA WIDTH", id: "extrawidth", section: "stair" }, { name: "OPEN RISER", id: "openriser", section: "stair" }, { name: "CUT STRINGER", id: "cutstringer", section: "stair" }, { name: "QUARTER LANDING", id: "quarterlanding", section: "stair" }, { name: "FULL LANDING", id: "fulllanding", section: "stair" }, { name: "2 WINDER", id: "2winder", section: "stair" }, { name: "3 WINDER", id: "3winder", section: "stair" }, { name: "LANDING/WINDER POST", id: "landingpost", section: "stair" }, { name: "D-STEP", id: "dstep", section: "stair" },
    { isTitle: true, name: "Balustrade", section: "balustrade" }, { name: "NEWEL POST", id: "newelpost", section: "balustrade" }, { name: "TURNED BALUSTRADE", id: "turnedbal", section: "balustrade"}, { name: "BIG POST", id: "bigpost", section: "balustrade" }, { name: "TURNED NEWEL", id: "turnednewel", section: "balustrade" }, { name: "BALUSTRADE", id: "balustrade", section: "balustrade" }, { name: "SCREEN", id: "screen", section: "balustrade" }, { name: "HANDRAIL ON BRACKET", id: "handrailbracket", section: "balustrade" }, { name: "BRACKET", id: "bracket", section: "balustrade" }, { name: "CONTINUOUS RAIL MITRES", id: "railmitres", section: "balustrade" }, { name: "CPOST CAPS/BALL TOPS", id: "balltops", section: "balustrade" }, { name: "SAWTOOTH", id: "sawtooth", section: "balustrade" }, { name: "DIMINISH", id: "diminish", section: "balustrade" },
    { isTitle: true, name: "Extras", section: "extras" }, { name: "DISPOSE", id: "dispose", section: "extras" }, { name: "EXT 3 RAIL HARDWOOD", id:"ext3", section: "extras"}, { name: "DOWELL", id: "dowell", section: "extras"}, { name: "DOWELL THREE RAIL", id: "dowell3", section: "extras"}, { name: "EXT 2 RAIL PINE", id: "ext2", section: "extras"}, { name: "FOOTINGS", id: "footings", section: "extras"}, { name: "POST BALLS/LASER CUT CENTRES", id: "balls", section: "extras"},
];

const productTypes = [
    { value: "kwilaint", label: "Kwila Internal" }, { value: "kwilaext", label: "Kwila External" }, { value: "hardext", label: "Rough Sawn Hardwood" }, { value: "durian", label: "Durian" }, { value: "amoak", label: "American Oak" }, { value: "brushbox", label: "Brushbox" }, { value: "gum", label: "Spotted Gum" }, { value: "tas", label: "Vic Ash" }, { value: "pine", label: "Pine" }, { value: "carpet", label: "Cover Grade" }, { value: "blackbutt", label: "Blackbutt" },
];

export default function QuoteCalculator() {
    const [productType, setProductType] = useState("");
    const [prices, setPrices] = useState({});
    const [quantities, setQuantities] = useState({});
    const [gstRate, setGSTRate] = useState(0.10);
    const [extraCostsQuantity, setExtraCostsQuantity] = useState("");
    const [extraCostsPrice, setExtraCostsPrice] = useState("");
    const [quoteTitle, setQuoteTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedQuotes, setSavedQuotes] = useState([]);
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [quoteIdToEdit, setQuoteIdToEdit] = useState(null);
    const [quoteBeingEdited, setQuoteBeingEdited] = useState(null);
    const menuRef = useRef(null);

    // *** FIX: Added where() clause to filter prices by company ***
    useEffect(() => {
        if (!productType || !currentUser?.company) {
            setPrices({});
            return;
        };
        setLoading(true);
        const q = query(
            collection(db, "productprices"), 
            where("name", "==", productType),
            where("company", "==", currentUser.company) // This line is the fix
        );
        getDocs(q).then(snap => {
            if (!snap.empty) {
                setPrices(snap.docs[0].data());
            } else {
                console.warn(`No prices found for product type "${productType}" and company "${currentUser.company}"`);
                setPrices({});
            }
        }).catch(err => console.error("Error fetching prices:", err))
          .finally(() => setLoading(false));
    }, [productType, currentUser?.company]);

    const filteredPartsList = productType ? partsList.filter(part => part.isTitle || prices[part.id] !== undefined) : [];

    useEffect(() => {
        if (!currentUser?.company) return;
        const q = query(collection(db, "quotes"), where("company", "==", currentUser.company), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const quotesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedQuotes(quotesData);
        }, (error) => {
            console.error("Error fetching saved quotes:", error);
        });

        return () => unsubscribe(); 
    }, [currentUser?.company]);

    const calculateSubtotal = () => {
        let subtotal = Object.keys(quantities).reduce((acc, partId) => {
            const quantity = parseInt(quantities[partId], 10) || 0;
            return acc + (quantity * (prices[partId] || 0));
        }, 0);
        const extra = (parseInt(extraCostsQuantity, 10) || 0) * (parseFloat(extraCostsPrice) || 0);
        return subtotal + extra;
    };

    const subtotal = calculateSubtotal();
    const gst = subtotal * gstRate;
    const total = subtotal + gst;

    const resetForm = () => {
        setQuoteTitle("");
        setProductType("");
        setQuantities({});
        setExtraCostsQuantity("");
        setExtraCostsPrice("");
        setIsEditing(false);
        setQuoteIdToEdit(null);
        setQuoteBeingEdited(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const quoteData = {
            company: currentUser?.company,
            productType,
            quoteTitle,
            total,
            createdAt: isEditing && quoteBeingEdited ? quoteBeingEdited.createdAt : new Date(),
            quantities,
            extraCostsQuantity,
            extraCostsPrice,
        };

        try {
            if (isEditing && quoteIdToEdit) {
                await setDoc(doc(db, "quotes", quoteIdToEdit), quoteData, { merge: true });
            } else {
                await addDoc(collection(db, "quotes"), quoteData);
            }
            resetForm();
        } catch (error) { console.error("Error saving document: ", error); }
        finally { setIsSubmitting(false); }
    };
    
    const handleEditQuote = (quote) => {
        setQuoteTitle(quote.quoteTitle);
        setProductType(quote.productType);
        setQuantities(quote.quantities || {});
        setExtraCostsQuantity(quote.extraCostsQuantity || "");
        setExtraCostsPrice(quote.extraCostsPrice || "");
        setQuoteIdToEdit(quote.id);
        setQuoteBeingEdited(quote);
        setIsEditing(true);
        setMenuOpen(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteQuote = async (quoteId) => {
        if (window.confirm("Are you sure you want to delete this quote?")) {
            try {
                await deleteDoc(doc(db, "quotes", quoteId));
            } catch (error) { console.error("Error deleting document: ", error); }
        }
    };
    
    // --- The rest of the component's JSX is the same ---
    return (
        <div className="p-6 md:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-brand-dark">Quote Calculator</h1>
                <p className="text-gray-500 mt-1">Create, edit, and manage client quotes.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-brand-accent">
                <h2 className="text-xl font-bold text-brand-dark mb-4">{isEditing ? 'Edit Quote' : 'Create a New Quote'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quoteTitle" className="block text-sm font-medium text-gray-700 mb-1">Quote Title</label>
                            <input id="quoteTitle" type="text" value={quoteTitle} onChange={(e) => setQuoteTitle(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                            <select id="productType" value={productType} onChange={(e) => setProductType(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                <option value="">Select a product...</option>
                                {productTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            
            {productType && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-bold text-brand-dark mb-4">Calculator</h2>
                    {loading ? <p>Loading prices...</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-2/5">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sub-total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPartsList.map(part => {
                                        if (part.isTitle) return (<tr key={part.name}><td colSpan="4" className="px-4 py-3 bg-gray-100 font-bold text-brand-dark">{part.name}</td></tr>);
                                        const cost = prices[part.id] || 0;
                                        const quantity = quantities[part.id] || "";
                                        const subtotalItem = cost * (parseInt(quantity, 10) || 0);
                                        return (
                                            <tr key={part.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{part.name}</td>
                                                <td className="px-4 py-3"><input type="number" value={quantity} onChange={e => setQuantities({...quantities, [part.id]: e.target.value})} className="w-24 p-1 border border-gray-300 rounded-md" /></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${cost.toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${subtotalItem.toFixed(2)}</td>
                                            </tr>
                                        )
                                    })}
                                    <tr>
                                        <td className="px-4 py-3 font-semibold text-gray-800">EXTRA COSTS</td>
                                        <td className="px-4 py-3"><input type="number" value={extraCostsQuantity} onChange={e => setExtraCostsQuantity(e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md" /></td>
                                        <td className="px-4 py-3"><input type="number" value={extraCostsPrice} onChange={e => setExtraCostsPrice(e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md" placeholder="Price each" /></td>
                                        <td className="px-4 py-3 font-medium text-gray-900">${((parseInt(extraCostsQuantity,10) || 0) * (parseFloat(extraCostsPrice) || 0)).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                     <div className="mt-6 text-right space-y-2">
                        <p className="text-gray-600">Subtotal: <span className="font-bold text-brand-dark">${subtotal.toFixed(2)}</span></p>
                        <p className="text-gray-600">GST ({gstRate * 100}%): <span className="font-bold text-brand-dark">${gst.toFixed(2)}</span></p>
                        <p className="text-xl font-extrabold text-brand-dark">Total: <span className="text-brand-accent-secondary">${total.toFixed(2)}</span></p>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-dark text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Quote' : 'Save Quote')}
                        </button>
                        {isEditing && <button type="button" onClick={resetForm} className="text-gray-600 hover:text-black">Cancel</button>}
                    </div>
                </div>
            )}

            {savedQuotes.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md mt-8">
                    <h2 className="text-xl font-bold text-brand-dark mb-4">Saved Quotes</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {savedQuotes.map(quote => (
                                    <tr key={quote.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">{quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{quote.quoteTitle}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{productTypes.find(pt => pt.value === quote.productType)?.label || "N/A"}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-brand-dark">${quote.total?.toFixed(2) || '0.00'}</td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            <button onClick={() => handleEditQuote(quote)} className="text-brand-dark hover:text-brand-accent mr-4">Edit</button>
                                            <button onClick={() => handleDeleteQuote(quote.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
