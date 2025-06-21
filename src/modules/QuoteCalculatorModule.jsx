// QuotingCalculator Component
import React, { useState, useEffect, useRef, useContext } from "react";
import { collection, query, where, getDocs, addDoc, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const colors = {
    richBlack: "#343434",
    oxfordBlue: "#1b263b",
    yinmnBlue: "#415a77",
    silverLakeBlue: "#778da9a",
    platinum: "#d9d9d9",
};

const partsList = [
    { isTitle: true, name: "Stair", section: "stair" },
    { name: "SUPPLY ONLY", id: "supplyonly", section: "stair" },
    { name: "PRIVATE", id: "private", section: "stair" },
    { name: "BUILDER", id: "builder", section: "stair" },
    { name: "STAIR COST", id: "staircost", section: "stair" },
    { name: "EXTRA WIDTH", id: "extrawidth", section: "stair" },
    { name: "OPEN RISER", id: "openriser", section: "stair" },
    { name: "CUT STRINGER", id: "cutstringer", section: "stair" },
    { name: "QUARTER LANDING", id: "quarterlanding", section: "stair" },
    { name: "FULL LANDING", id: "fulllanding", section: "stair" },
    { name: "2 WINDER", id: "2winder", section: "stair" },
    { name: "3 WINDER", id: "3winder", section: "stair" },
    { name: "LANDING/WINDER POST", id: "landingpost", section: "stair" },
    { name: "D-STEP", id: "dstep", section: "stair" },
    { isTitle: true, name: "Balustrade", section: "balustrade" },
    { name: "NEWEL POST", id: "newelpost", section: "balustrade" },
    { name: "TURNED BALUSTRADE", id: "turnedbal", section: "balustrade"},
    { name: "BIG POST", id: "bigpost", section: "balustrade" },
    { name: "TURNED NEWEL", id: "turnednewel", section: "balustrade" },
    { name: "BALUSTRADE", id: "balustrade", section: "balustrade" },
    { name: "SCREEN", id: "screen", section: "balustrade" },
    { name: "HANDRAIL ON BRACKET", id: "handrailbracket", section: "balustrade" },
    { name: "BRACKET", id: "bracket", section: "balustrade" },
    { name: "CONTINUOUS RAIL MITRES", id: "railmitres", section: "balustrade" },
    { name: "CPOST CAPS/BALL TOPS", id: "balltops", section: "balustrade" },
    { name: "SAWTOOTH", id: "sawtooth", section: "balustrade" },
    { name: "DIMINISH", id: "diminish", section: "balustrade" },
    { isTitle: true, name: "Extras", section: "extras" },
    { name: "DISPOSE", id: "dispose", section: "extras" },
];

function QuotingCalculator() {
    const [productType, setProductType] = useState("");
    const [prices, setPrices] = useState({});
    const [quantities, setQuantities] = useState({});
    const [gstRate, setGSTRate] = useState(0.10);
    const [extraCostsQuantity, setExtraCostsQuantity] = useState("");
    const [extraCostsPrice, setExtraCostsPrice] = useState("");
    const [quoteTitle, setQuoteTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [savedQuotes, setSavedQuotes] = useState([]);
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [quoteIdToEdit, setQuoteIdToEdit] = useState(null);
    const [quoteBeingEdited, setQuoteBeingEdited] = useState(null);
    const menuRef = useRef(null);
    const [filteredPartsList, setFilteredPartsList] = useState(partsList);
    const productTypes = [
        { value: "kwilaint", label: "Kwila Internal" },
        { value: "kwilaext", label: "Kwila External" },
        { value: "hardext", label: "Hardwood External" },
        { value: "durian", label: "Durian" },
        { value: "amoak", label: "American Oak" },
        { value: "brushbox", label: "Brushbox" },
        { value: "gum", label: "SP-GUM B-BUTT" },
        { value: "tas", label: "Tas Oak" },
        { value: "pine", label: "Clear Pine" },
        { value: "carpet", label: "Carpet" },
    ];

    useEffect(() => {
        const fetchPrices = async () => {
            if (!productType) {
                setFilteredPartsList(partsList); //reset the parts list
                return;
            }
            setLoading(true);
            try {
                const q = query(
                    collection(db, "productprices"),
                    where("name", "==", productType)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    setPrices(data);
                    // Filter partsList based on the keys in the data object
                    const availablePartIds = Object.keys(data);
                    const filteredParts = partsList.filter(part => part.isTitle || availablePartIds.includes(part.id));
                    setFilteredPartsList(filteredParts);
                } else {
                    console.log("No document found for product type:", productType);
                    setPrices({});
                    setFilteredPartsList(partsList); // Optionally reset or handle no data case
                }
            } catch (error) {
                console.error("Error fetching prices:", error);
                setPrices({});
                setFilteredPartsList(partsList); // Optionally reset or handle error case
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, [productType]);

    useEffect(() => {
        const fetchSavedQuotes = async () => {
            if (!currentUser?.company) return;

            const q = query(
                collection(db, "quotes"),
                where("company", "==", currentUser.company),
                orderBy("createdAt", "desc")
            );

            try {
                const querySnapshot = await getDocs(q);
                const quotesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const filteredQuotes = quoteBeingEdited
                    ? quotesData.filter((quote) => quote.id !== quoteBeingEdited.id)
                    : quotesData;
                setSavedQuotes(filteredQuotes);
            } catch (error) {
                console.error("Error fetching saved quotes:", error);
            }
        };

        fetchSavedQuotes();
    }, [currentUser?.company, quoteBeingEdited]);

    const handleProductTypeChange = (e) => {
        setProductType(e.target.value);
        setQuantities({});
    };

    const handleQuantityChange = (partId, value) => {
        let validatedValue = value;
        const parsedValue = parseInt(value, 10);

        if (value !== "" && (isNaN(parsedValue) || parsedValue < 0)) {
            validatedValue = "";
        }

        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [partId]: validatedValue,
        }));
    };

    const calculateSectionTotal = (section) => {
        let sectionTotal = 0;
        const sectionItems = filteredPartsList.filter(part => part.section === section && !part.isTitle);

        for (const item of sectionItems) {
            const quantity = quantities[item.id] === "" ? 0 : parseInt(quantities[item.id], 10) || 0;
            const price = prices[item.id] || 0;
            sectionTotal += quantity * price;
        }

        if (section === "extras") {
            sectionTotal += (extraCostsQuantity === "" ? 0 : parseInt(extraCostsQuantity, 10)) * (extraCostsPrice === "" ? 0 : parseFloat(extraCostsPrice));
        }

        return sectionTotal;
    };

    const calculateSubtotal = () => {
        let subtotal = 0;
        for (const partId in quantities) {
            if (quantities.hasOwnProperty(partId) && prices.hasOwnProperty(partId)) {
                const quantity = quantities[partId] === "" ? 0 : parseInt(quantities[partId], 10);
                subtotal += quantity * (prices[partId] || 0);
            }
        }
        const extraCostsSubtotal = (extraCostsQuantity === "" ? 0 : parseInt(extraCostsQuantity, 10)) * (extraCostsPrice === "" ? 0 : parseFloat(extraCostsPrice));
        subtotal += extraCostsSubtotal;
        return subtotal;
    };

    const subtotal = calculateSubtotal();
    const gst = subtotal * gstRate;
    const total = subtotal + gst;

    const handleSubmit = async () => {
        try {
            const stairTotal = calculateSectionTotal("stair");
            const balustradeTotal = calculateSectionTotal("balustrade");
            const extrasTotal = calculateSectionTotal("extras");

            const quoteData = {
                company: currentUser?.company,
                productType: productType,
                stairTotal,
                balustradeTotal,
                extrasTotal,
                quoteTitle,
                total,
                createdAt: new Date(),
                quantities,
                extraCostsQuantity,
                extraCostsPrice,
            };

            if (isEditing && quoteIdToEdit) {
                // Update in Firestore
                const quoteDocRef = doc(db, "quotes", quoteIdToEdit);
                await setDoc(quoteDocRef, quoteData, { merge: true });

                // Update in local state
                setSavedQuotes(prevQuotes =>
                    prevQuotes.map(q => (q.id === quoteIdToEdit ? { id: q.id, ...quoteData } : q))
                );
            } else {
                // Save new in Firestore
                const docRef = await addDoc(collection(db, "quotes"), quoteData);

                // Add to local state for immediate update
                setSavedQuotes(prev => [
                    { id: docRef.id, ...quoteData },
                    ...prev
                ]);
            }

            // Reset form
            setIsEditing(false);
            setQuoteIdToEdit(null);
            setQuoteTitle("");
            setProductType("");
            setQuantities({});
            setExtraCostsQuantity("");
            setExtraCostsPrice("");
            setQuoteBeingEdited(null);
        } catch (error) {
            console.error("Error saving/updating document: ", error);
        }
    };


    const handleDeleteQuote = async (quoteId) => {
        try {
            await deleteDoc(doc(db, "quotes", quoteId));
            setSavedQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
            console.log("Quote deleted with ID: ", quoteId);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const handleEditQuote = (quote) => {
        setQuoteTitle(quote.quoteTitle);
        setProductType(quote.productType);
        setQuantities(quote.quantities || {});
        setExtraCostsQuantity(quote.extraCostsQuantity || "");
        setExtraCostsPrice(quote.extraCostsPrice || "");
        setQuoteIdToEdit(quote.id);
        setIsEditing(true);
        setMenuOpen(null);
        setQuoteBeingEdited(quote);
    };

    // Styles
    const pageStyle = {
        minHeight: "100vh",
        backgroundColor: colors.platinum,
        color: colors.richBlack,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    };

    const containerStyle = {
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "2rem",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(27, 38, 59, 0.15)`,
    };

    const headerStyle = {
        fontSize: "2.2rem",
        fontWeight: "700",
        marginBottom: "1.5rem",
        color: colors.oxfordBlue,
        fontSize: "0.9rem",
    };

    const selectStyle = {
        width: "100%",
        padding: "0.75rem",
        marginBottom: "1.5rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "8px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "1rem",
        outline: "none",
    };

    const tableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "1rem",
        boxShadow: `0 2px 6px rgba(27, 38, 59, 0.1)`,
        borderRadius: "8px",
        overflow: "hidden",
    };

    const thStyle = {
        backgroundColor: colors.yinmnBlue,
        color: "white",
        fontWeight: "600",
        padding: "1rem",
        textAlign: "left",
        fontSize: "0.9rem",
    };

    const tdStyle = {
        padding: "1rem",
        borderBottom: `1px solid ${colors.silverLakeBlue}`,
        fontSize: "0.95rem",
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "6px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "0.9rem",
        outline: "none",
    };

    const totalsStyle = {
        marginTop: "2rem",
        fontSize: "1.1rem",
        color: colors.oxfordBlue,
    };

    const titleStyle = {
        fontStyle: "italic",
        fontWeight: "bold",
        padding: "1rem",
        textAlign: "left",
        fontSize: "1rem",
    };

    const buttonStyle = {
        backgroundColor: colors.yinmnBlue,
        color: "white",
        padding: "0.75rem 1.5rem",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "600",
        marginTop: "1rem",
        transition: "background-color 0.2s ease",
        "&:hover": {
            backgroundColor: colors.oxfordBlue,
        },
    };

    const savedQuotesTableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "2rem",
        boxShadow: `0 2px 6px rgba(27, 38, 59, 0.1)`,
        borderRadius: "8px",
        overflow: "hidden",
    };

    const savedQuotesThStyle = {
        backgroundColor: colors.oxfordBlue,
        color: "white",
        fontWeight: "600",
        padding: "0.75rem",
        textAlign: "left",
        fontSize: "0.8rem",
    };

    const savedQuotesTdStyle = {
        padding: "0.75rem",
        borderBottom: `1px solid ${colors.silverLakeBlue}`,
        fontSize: "0.85rem",
    };

    const inputTitle = {
        width: "100%",
        padding: "0.6rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "6px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "0.9rem",
        outline: "none",
    };

    const kebabMenuStyle = {
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
    };

    const kebabButton = {
        background: 'none',
        border: 'none',
        padding: '10',
        width: '20px',   /* Adjust as needed */
        height: '20px',  /* Adjust as needed */
        marginLeft: '-5px', /* Adjust negative margin to compensate */
        marginRight: '-5px',
        cursor: 'pointer',
    };

    const menuContentStyle = {
        position: 'absolute',
        right: 0,
        top: '100%',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '5px 0',
        zIndex: 1,
        minWidth: '150px',
    };

    const menuItemStyle = {
        padding: '8px 15px',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        display: 'block',
        width: '100%',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: '#f0f0f0',
        },
    };

    const toggleMenu = (quoteId) => {
        setMenuOpen(menuOpen === quoteId ? null : quoteId);
    };

    // Create empty rows with tdStyle applied
    const emptyRows = Array(2).fill(null).map((_, index) => (
        <tr key={`empty-${index}`}>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
            <td style={{ ...savedQuotesTdStyle, padding: '0', borderBottom: 'none' }}>&nbsp;</td>
        </tr>
    ));

    return (
        <div style={pageStyle}>
            <Navbar onLogout={() => navigate("/login")} />


            <div style={containerStyle}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Quote Calculator</h1>
                    <button
                        onClick={() => navigate("/client")}
                        style={buttonStyle}
                    >
                        ← Back to Homepage
                    </button>
                </div>
                <h1 style={headerStyle}>Quoting Calculator</h1>
                <label htmlFor="quoteTitle" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                    Quote Title:
                </label>
                <input
                    type="text"
                    id="quoteTitle"
                    style={inputTitle}
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    placeholder="Enter quote title"
                />
                <label htmlFor="productType" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                    Product Type:
                </label>
                <select
                    id="productType"
                    style={selectStyle}
                    value={productType}
                    onChange={handleProductTypeChange}
                >
                    <option value="">Select Product Type</option>
                    {productTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>

                {loading && <p>Loading prices...</p>}

                {productType && !loading && (
                    <div>
                        <h2 style={{ ...headerStyle, fontSize: "1.8rem", marginBottom: "1rem" }}>Parts and Quantities</h2>

                        <div className="overflow-x-auto">
                            <table style={tableStyle}>
                                <thead style={{ backgroundColor: colors.yinmnBlue }}>
                                    <tr>
                                        <th style={{ ...thStyle, width: "40%" }}>Item</th>
                                        <th style={{ ...thStyle, width: "20%" }}>Quantity</th>
                                        <th style={{ ...thStyle, width: "20%" }}>Cost</th>
                                        <th style={{ ...thStyle, width: "20%" }}>Sub-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPartsList.map((part) => { // Use filteredPartsList here
                                        if (part.isTitle) {
                                            return (
                                                <tr key={part.name}>
                                                    <td colSpan="4" style={titleStyle} dangerouslySetInnerHTML={{ __html: part.name }} />
                                                </tr>
                                            );
                                        }

                                        const cost = prices[part.id] || 0;
                                        const quantity = quantities[part.id] || "";
                                        const subtotalItem = cost * (quantity === "" ? 0 : parseInt(quantity, 10));

                                        return (
                                            <tr key={part.id}>
                                                <td style={tdStyle}>{part.name}</td>
                                                <td style={tdStyle}>
                                                    <input
                                                        type="number"
                                                        style={inputStyle}
                                                        value={quantity}
                                                        onChange={(e) => handleQuantityChange(part.id, e.target.value)}
                                                        min="0"
                                                        placeholder=""
                                                    />
                                                </td>
                                                <td style={tdStyle}>${cost}</td>
                                                <td style={tdStyle}>${subtotalItem.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Extra Costs input */}
                                    <tr>
                                        <td style={tdStyle}>EXTRA COSTS</td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                value={extraCostsQuantity}
                                                onChange={(e) => setExtraCostsQuantity(e.target.value)}
                                                min="0"
                                                placeholder=""
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                value={extraCostsPrice}
                                                onChange={(e) => setExtraCostsPrice(e.target.value)}
                                                placeholder=""
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            ${((extraCostsQuantity === "" ? 0 : parseInt(extraCostsQuantity, 10)) * (extraCostsPrice === "" ? 0 : parseFloat(extraCostsPrice))).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={totalsStyle}>
                            <h2 style={{ ...headerStyle, fontSize: "1.6rem", marginTop: "1.5rem", marginBottom: "0.8rem" }}>Totals</h2>
                            <p>Subtotal: ${subtotal.toFixed(2)}</p>
                            <p>GST ({gstRate * 100}%): ${gst.toFixed(2)}</p>
                            <p style={{ fontSize: "1.3rem", fontWeight: "600" }}>Total: ${total.toFixed(2)}</p>
                        </div>
                    </div>
                )}
                <button style={buttonStyle} onClick={handleSubmit}>
                    {isEditing ? "Update Quote" : "Save Quote"}
                </button>
                {/* Saved Quotes Table */}
                {savedQuotes.length > 0 && (
                    <div>
                        <h2 style={{ ...headerStyle, fontSize: "1.6rem", marginTop: "2rem", marginBottom: "1rem" }}>Saved Quotes</h2>
                        <div className="overflow-x-auto">
                            <table style={savedQuotesTableStyle}>
                                <thead>
                                    <tr>
                                        <th style={savedQuotesThStyle}>Date</th>
                                        <th style={savedQuotesThStyle}>Quote Title</th>
                                        <th style={savedQuotesThStyle}>Product Type</th>
                                        <th style={savedQuotesThStyle}>Stair Total</th>
                                        <th style={savedQuotesThStyle}>Balustrade Total</th>
                                        <th style={savedQuotesThStyle}>Extras Total</th>
                                        <th style={savedQuotesThStyle}>Total</th>
                                        <th style={savedQuotesThStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedQuotes.map(quote => (
                                        <tr key={quote.id}>
                                            <td style={savedQuotesTdStyle}>
                                                {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : new Date(quote.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={savedQuotesTdStyle}>{quote.quoteTitle}</td>
                                            <td style={savedQuotesTdStyle}>{productTypes.find(pt => pt.value === quote.productType)?.label || "Unknown"}</td>
                                            <td style={savedQuotesTdStyle}>${quote.stairTotal?.toFixed(2) || 0}</td>
                                            <td style={savedQuotesTdStyle}>${quote.balustradeTotal?.toFixed(2) || 0}</td>
                                            <td style={savedQuotesTdStyle}>${quote.extrasTotal?.toFixed(2) || 0}</td>
                                            <td style={savedQuotesTdStyle}>${quote.total?.toFixed(2) || 0}</td>
                                            <td style={savedQuotesTdStyle}>
                                                <div style={kebabMenuStyle} ref={menuRef}>
                                                    <button
                                                        style={kebabButton}
                                                        onClick={() => toggleMenu(quote.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faEllipsisV} />
                                                    </button>
                                                    {menuOpen === quote.id && (
                                                        <div style={menuContentStyle}>
                                                            <button
                                                                style={menuItemStyle}
                                                                onClick={() => {
                                                                    handleEditQuote(quote);
                                                                    toggleMenu(null);
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                style={menuItemStyle}
                                                                onClick={() => {
                                                                    handleDeleteQuote(quote.id);
                                                                    toggleMenu(null);
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {Array(2).fill(null).map((_, index) => (
                                        <tr key={`empty-${index}`} style={{ height: '38px' }}>
                                            <td style={{ padding: '0', borderBottom: 'none' }}>&nbsp;</td>
                                            <td style={{ padding: '0', borderBottom: 'none' }}>&nbsp;</td>
                                            <td style={{ padding: '0', borderBottom: 'none' }}>&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuotingCalculator;
