import React, { useState } from 'react';
import { createUserWithEmailAndPassword,signOut, sendEmailVerification } from 'firebase/auth';
import { ref, set,get } from 'firebase/database';
import { auth, database } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { PlusCircleIcon } from "@heroicons/react/solid";
import axios from 'axios';
import { useLocation } from "react-router-dom";
import { useEffect } from 'react';
import Swal from 'sweetalert2';

const CLOUDINARY_UPLOAD_PRESET="profile_picture";
const CLOUDINARY_CLOUD_NAME="dqe76a7cx";

const tamilNaduDistricts = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi",
  "Kancheepuram", "Karur", "Krishnagiri", "Kanyakumari","Madurai","Mayiladuthurai", "Nagapattinam", "Namakkal","Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivagangai", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli",
  "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Thiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

const cityData = {
"Chennai": ["Adyar", "Alandur", "Ambattur", "Anna Nagar", "Ashok Nagar", "Chetpet", "Egmore", "Guindy", "Karapakkam", "Kasimedu", "Kilpauk", "Kodambakam", "Kodambakkam", "Kodungaiyur", "Kolathur", "Madhavaram", "Mambalam", "Manali", "Marina", "Medavakkam", "Minambakkam", "Mint", "Mylapore", "Nungambakkam", "Palavanthangal", "Parrys Corner", "Pattinamabakkam", "Perambur", "Perungudi", "Pulianthope", "Purasaiwalkam", "Rayapuram", "Royapuram", "Saidapet", "Sholinganallur", "Sowcarpet", "StThomas Mount", "T. Nagar", "Teynampet", "Thiruvottiyur", "Thoraipakkam", "Thiru Vi Ka Nagar", "Tondiarpet", "Triplicane", "Valasaravakkam", "Velachery", "Vyasarpadi", "Washermanpet"],
"Chengalpattu": ["Chengalpattu", "Chromepet", "Guduvanchery", "Kattankulathur", "Kayarambedu", "Kelambakkam", "Kovalam", "Kundrathur", "Madambakkam", "Mannivakkam", "Maraimalai Nagar", "Nallambakkam", "Oorapaakam", "Pallavaram", "Pammal", "Paranur", "Peerkankaranai", "Perungulathur", "Potheri","Poonamallee ", "Selaiyur", "Sembakkam", "Singaperumal Koil", "Tambaram", "Thaiyur", "Thiruneermalai", "Thiruporur", "Tirusulam", "Urapakkam", "Vandalur", "Vengambakkam", "Venkatamangalam"],
"Kancheepuram": ["Cheyyar", "Kanchipuram", "Kavanur", "Kooram", "Nattapettai", "Oragadam", "Pattunoolkara Street", "Periyanagalur", "Pillaipakkam", "Sevilimedu", "Sriperumbudur", "Sunguvarchatram", "Thirukalukundram", "Uthiramerur", "Walajabad"],
"Ariyalur": ["Alanduraiyarkattalai", "Andimadam", "Ariyalur", "Jayankondam", "Kallankurichi", "Kamalapuram", "Karisalkulam", "Keelapalur", "Kodali", "Kunnam", "Manakkal", "Neyveli (Ariyalur Side)", "Ottakoil", "Ponparappi", "Reddipalayam", "Sendurai", "Thirumanur", "Thiruvenganur", "Thular", "T.Palur", "Udayarpalayam", "Varadarajanpettai", "Vilangudi", "V.Kalathur", "Periyathirukonam"],
"Thiruvallur": ["Alapakkam", "Ambattur", "Arani", "Avadi", "Gummidipoondi", "Kakkalur", "Kadambathur", "Kanakamma Chathram", "Kavarapettai", "Kilkondaiyur", "Kollatur", "Koppur", "Kuthambakkam", "Madavaram Milk Colony", "Madhavaram", "Manali", "Minjur", "Nemilichery", "Palavakkam", "Periyapalayam", "Perungavoor", "Ponneri", "Poonamallee", "Puduchatram", "Puduvoyal", "Redhills", "Sevvapet", "Thamaraipakkam", "Thiruthani", "Tiruninravur", "Tirupachur", "Tiruvallur", "Uthukottai", "Vellanur", "Vengal", "Veppampattu"],
"Vellore": ["Anaicut", "Arakkonam", "Arcot", "Arumbakkam", "Gudiyatham", "Kaniyambadi", "Katpadi", "Kalavai", "Kaveripakkam", "Kaveripakkam", "K.V.Kuppam", "Latteri", "Melpatti", "Melvisharam", "Mothakkal", "Nemili", "Odugathur", "Pallikonda", "Pennathur", "Sathuvachari", "Sevoor", "Sholingur", "Thiruvalam", "Timiri", "Vellore", "Vilapakkam", "Virinchipuram"],
"Thiruvannamalai": ["Anakkavur", "Arani", "Avalurpet", "Chetpet", "Chengam", "Cheyyar", "Desur", "Devikapuram", "Jamunamarathur", "Kadaladi", "Kalambur", "Kalasapakkam", "Kanji", "Kilpennathur", "Mamandur", "Mangalam", "Mazhaiyur", "Melmalayanur", "Nallavanpalayam", "Pachchampalayam", "Peranamallur", "Polur", "Pudupalayam", "Seeyar", "Somasipadi", "Thiruvannamalai", "Thiruvathipuram", "Thellar", "Thurinjapuram", "Vandavasi", "Vembakkam", "Vettavalam"],
"Dharmapuri": ["Adhiyamankottai", "Ammampalayam", "Balajangamanahalli", "Bommidi", "Dharmapuri", "Eriyur", "Erranahalli", "Harur", "Kadathur", "Kambainallur", "Karimangalam", "Kookkuttapatti", "Kottapatti", "Mallapuram", "Marandahalli", "Morappur", "Nallampalli", "Nagadasampatti", "Palacode", "Pappireddipatti", "Periyanahalli", "Pennagaram", "Thadangam", "Theerthagiri"],
"Krishnagiri": ["Agasipalli", "Alandapatti", "Bargur", "Berigai", "Chandrapatti", "Chinnamanavadi", "Denkanikottai", "Hosur", "Kandikuppam", "Kaveripattinam", "Kelamangalam", "Komarapalayam", "Kottaiyur", "Kottur", "Krishnagiri", "Kundarapalli", "Mallanapalli", "Marichettihalli", "Mathur", "Morappur", "Nagojanahalli", "Nagarasampatti", "Nandimangalam", "Pannandur", "Palayapalayam", "Pochampalli", "Singarapettai", "Soolagiri", "Shoolagiri", "Thally", "Uthangarai", "Veppanapalli"],
"Salem": ["Alagapuram", "Ammapet", "Annathanapatti", "Attur", "Ayothiapattinam", "Belur", "Edappadi", "Gangavalli", "Hasthampatti", "Ilampillai", "Jalakandapuram", "Kadayampatti", "Kannankurichi", "Karuppur", "Kitchipalayam", "Kolathur", "Kondalampatti", "Konganapuram", "Magudanchavadi", "Mallur", "Mecheri", "Mettur", "Nangavalli", "Omalur", "Panamarathupatti", "Perumagoundampatti", "Salem", "Sankari", "Seelanaickenpatti", "Sivathapuram", "Thalaivasal", "Tharamangalam", "Thevur", "Valapadi", "Vazhapadi", "Veerapandi", "Veerakkalpudur", "Yercaud"],
"Namakkal": ["Alavaipatti", "Erumaipatti", "Jedarpalayam", "Kabilarmalai", "Koothampoondi", "Konganapuram", "Kumarapalayam", "Mallasamudram", "Mohannur", "Namakkal", "Nallipalayam", "Pallipalayam", "Pallipalayam Agraharam", "Pandamangalam", "Paramathi Velur", "Pudur", "Puduchatram", "Rasipuram", "Sendamangalam", "Thiruchengodu", "Vattur", "Vennandur", "Velur"],
"Erode": ["Anthiyur", "Appakudal", "Arachalur", "Bhavani", "Bhavanisagar", "Chithode", "Erode", "Ellapalayam", "Gobichettipalayam", "Kanjikoil", "Kasipalayam", "Kasipalayam (G)", "Kodiveri", "Kodumudi", "Komarapalayam", "Kavindapadi", "Kavundapadi", "Modakkurichi", "Moolapalayam", "Mettukadai", "Nambiyur", "Nasiyanur", "Pallipalayam", "Periyasemur", "Perundurai", "Seenapuram", "Surampatti", "Talavadi", "Thindal", "Vairapalayam", "Vellakoil", "Veerappanchatram"],
"Tiruppur": ["Alangiyam", "Anuparpalayam", "Arulpuram", "Avinashi", "Avinashipalayam", "Chettipalayam", "Chinnakkampalayam", "Dharapuram", "Iduvai", "Kasipalayam", "Kolumam", "Komaralingam", "Kundadam", "Kunnathur", "Madathukulam", "Mangalam", "Mudhalipalayam", "Muthur", "Nallur", "Padiyur", "Palladam", "Perumanallur", "Pongalur", "Samalapuram", "Tirupur", "Thirumuruganpoondi", "Udumalaipettai", "Uthukuli", "Vaniputhur", "Veerapandi", "Vellakoil"],
"Coimbatore": ["Annur", "Chinniampalayam", "Chinnathadagam", "Coimbatore", "Goundampalayam", "Irugur", "Kalapatti", "Karamadai", "Karumathampatti", "Kinathukadavu", "Kovaipudur", "Kuniamuthur", "Kurichi", "Madampatti", "Madukkarai", "Malumichampatti", "Mettupalayam", "Narashimanaickenpalayam", "Ondipudur", "Othakalmandapam", "Pappampatti", "Peelamedu", "Periyanayakkanpalayam", "Perur", "Saravanampatti", "Sultanpet", "Sulur", "Sundarapuram", "Thondamuthur","Telungupalayam", "Thirumalayampalayam", "Valparai", "Vadavalli", "Vedapatti", "Velandipalayam", "Vellalore"],
"Cuddalore": ["Annagramam", "Alapakkam", "Bhuvanagiri", "Chidambaram", "Cuddalore", "Eachangadu", "Indira Nagar", "Kammapuram", "Karunguli", "Kattumannarkoil", "Keerapalayam", "Kudikadu", "Kumaratchi", "Kurinjipadi", "Manjakuppam", "Mangalampettai", "Melakadambur", "Melpattampakkam", "Mudikandanallur", "Nellikuppam", "Neyveli", "Palur", "Panruti", "Parangipettai", "Pennadam", "Perperiyankuppam", "Sethiyathope", "Semakottai", "Srimushnam", "Thirupadripuliyur", "Thiruvandipuram", "Vadakkumangudi", "Vadalur", "Veppur", "Villianur", "Virudhachalam"],
"Villupuram": [ "Alagramam", "Anniyur", "Arakandanallur", "Arasur", "Gingee", "Kadaperikuppam", "Karanai", "Kandarakottai", "Kanai", "Kedar", "Kombai", "Kombakkam", "Koliyanur", "Kottakuppam", "Mailam", "Mambalapattu", "Marakkanam", "Melmalayanur", "Melpettai", "Mugaiyur", "Munnur", "Nainarpalayam", "Nallathur", "Olakkur", "Parikkal", "Perumbakkam", "Serndanur", "Sithalingamadam", "Siruvanthadu", "Tindivanam", "Thirukkanur", "Thirunavalur", "Thirupachur", "Thiruvennainallur", "Thiruvamur", "Vanur", "V. Salai", "Vadhanur", "Villupuram", "Vikravandi"],
"Thanjavur": ["Adirampattinam", "Aduthurai", "Ammapettai", "Ayyampettai", "Budalur", "Dharasuram", "Kumbakonam", "Madukkur", "Melattur", "Orathanadu", "Papanasam", "Pandaravaadi", "Peravurani", "Swamimalai", "Thanjavur", "Thirnageswaram", "Thirukkatupalli", "Thirupanandal", "Thiruvaiyaru", "Thiruvidaimaruthur"],
"Nagapattinam": ["Keelvelur", "Kodiyakarai", "Manjakollai", "Nagapattinam", "Nagore", "Thalanayar", "Thittachery","Thirukkuvalai", "Vedaranyam", "Velankanni"],
"Ramanathapuram": ["Abiramam", "Devipattinam", "Kamuthi", "Keelakarai", "Mandapam", "Mudukulathur", "Paramakudi", "R.S.Mangalam", "Ramanathapuram", "Rameswaram", "Sayalkudi", "Thondi"],
"Virudhunagar": ["Alangulam", "Aruppukkottai", "Chettiyarpatti", "Kariapatti", "M.Reddiapatti", "Mallanginar", "Mamsapuram", "Narikudi","Kovilpatti", "Rajapalayam", "S.Kodikulam", "Sattur", "Seithur", "Sivakasi", "Srivilliputhur", "Sundarapandiam", "Vembakottai", "Virudhunagar", "Virudhunagar Town", "Watrap", "W.Pudupatti"],
"Kanyakumari": ["Agastheeswaram", "Aralvaimozhi", "Arumanai", "Aruvikkarai", "Attoor", "Azhagiapandipuram", "Boothapandi", "Chittar", "Colachel", "Colachel Beach", "Colachel Port", "Enayam", "Eraniel", "Ezhudesam", "Kanniyakumari", "Karungal", "Killiyur", "Kalkulam", "Kottaram", "Kulasekharam", "Kurunthancode", "Kuzhithurai", "Manakudi", "Manavalakurichi", "Marthandam", "Melasankarankuzhi", "Melpuram", "Munchirai", "Myladi", "Nagercoil", "Nallur", "Nithiravilai", "Pacode", "Padmanabhapuram", "Palliyadi", "Pazhayar", "Pechiparai", "Puthukkadai", "Reethapuram", "Suchindram", "Suchindrum", "Swamithoppe", "Thazhakudi", "Thengapattanam", "Thirparappu", "Thiruvattar", "Thiruvarambu", "Thovalai", "Vaniyakudi", "Vattakottai", "Verkilambi", "Vilavancode"],
"Madurai": ["Achampatti", "Alanganallur", "Avaniapuram", "Ayyankottai", "Chettipatti", "Chinnapatti", "Elumalai", "Harveypatti", "Kachirayiruppu", "Kalligudi", "Kallanai", "Kallanthiri", "Kandiyur", "Kannanur", "Karadipatti", "Karuppatti", "Keelachinnampatti", "Keelaiyur", "Keelakuyilkudi", "Keelamathur", "Keelapatti", "Kondayampatti", "Kovilankulam", "Kudicheri", "Kuravakudi", "Kuppalnatham", "Madurai", "Mangalrevu", "Mannadimangalam", "Marani", "Maruthanatham", "Melamadai", "Melur", "Mettupatti", "Muduvarpatti", "Nallur", "Nattamangalam", "Pachaiyur", "Pallapatti", "Panniyan", "Pappapatti", "Pappinaickenpatti", "Paravai", "Pattur", "Perumalkoilpatti", "Pillaiyarnatham", "Ponnamangalam", "Pottapatti", "Pudupatti", "Pulipatti", "Puthanatham", "Puthur", "Rajagambeeram", "Sakkudi", "Samanatham", "Sathamangalam", "Sennagarampatti", "Sennampatti", "Sholavandan", "Silanatham", "Silarpatti", "Sinnapatti", "Sirukalapur", "Sirukudal", "Sirumalaipatti", "Sithalangudi", "Sithalapatti", "Sithireddipatti", "Sithur", "Sivarakottai", "Sokkanathapatti", "Somanathapatti", "Soolapuram", "Sundaranatham", "Surakkundu", "Thaniyamangalam", "Thatchanendal", "Thirumal", "Thirumalpuram", "Thirumalvadi", "Thirumanickam", "Thirumangalam", "Thiruparankundram", "Thiruvadhavur", "Thiruvedagam", "Thiruvedagam West", "Usilampatti", "Vadipatti"],
"Theni": ["Andipatti", "Andipatti Rural", "Bodi Metu", "Bodinayakanur", "Bodinayakanur Municipality", "Boothipuram", "Chinnamanur", "Chinnamanur Town Panchayat", "Cumbum", "Cumbum Town Panchayat", "Goodalur Town Panchayat", "Gudalur", "Kamayagoundanpatti", "Kambam", "Kambam Town Panchayat", "Kadamalaikundu", "Koduvilarpatti", "Kombai", "Kuchanur", "Kumananthozhu", "Lakshmipuram", "Lower Camp", "Manjalar Dam", "Markayankottai", "Megamalai", "Odaipatti", "Pannaipuram", "Pattiveeranpatti", "Periyakulam", "Periyakulam Municipality", "Periyakulam Rural", "Silamalai", "Suruli Falls", "Thevaram", "Theni", "Theni Allinagaram Municipality", "Theni Rural", "Uthamapalayam"],
"Tirunelveli":["Alangulam","Ambasamudram","Cheranmahadevi","Kadayam","Kadayanallur","Kalakkad","Keelapavoor","Manur","Melapalayam","Mukkudal","Nanguneri","Pappakudi","Palayamkottai","Panagudi","Puliangudi","Puliyankudi","Radhapuram","Sankarankovil","Shenkottai","Sivagiri","Surandai","Thisayanvilai","Tirunelveli","Valliyur","Veerakeralampudur","Vikramasingapuram"],
"Thiruvarur":["Adiyakkamangalam","Engan","Keelvelur","Kodavasal","Koothanallur","Koradacheri","Kottur","Mannargudi","Maruthur","Mudikondan","Muthupettai","Nagaiyarnattam","Nannilam","Needamangalam","Pamani","Peralam","Poonthottam","Sannanallur","Sengalipuram","Serangulam","Thirukannamangai","Thirukkaravasal","Thirupayathangudi","Thirupugalur","Thiruthuraipoondi","Thiruvarur","Valangaiman","Vaduvur","Vellur"],
"Tiruchirappalli":["BHEL Township","Cantonment","Crawford","Edamalaipatti Pudur","Gandhi Market","Golden Rock","Inamkulathur","Jeeyapuram","Kallakudi","KK Nagar","Kottapattu","Kumaran Nagar","Lalgudi","Manachanallur","Manapparai","Marungapuri","Melapudur","Musiri","Navalpattu","Palakarai","Peramangalam","Pullambadi","Puthur","Samayapuram","Somarasampettai","Srirangam","Thathaiyangarpet","Thillainagar","Thottiyam","Thuraiyur","Thuvakudi","Tiruchirapalli","Tiruvermbur","TVS Tolgate","Vaiyampatti","Woraiyur"],
"Sivagangai":["Devakottai","Ilayangudi","Kalaiyarkoil","Kallal","Kanadukathan","Karaikudi","Manamadurai","Nattarasankottai","Puduvayal","Singampunari","Sivagangai","Thirupuvanam","Tirupathur"],
"Perambalur":["Alathur", "Arumbavur", "Chettikulam", "Eraiyur", "Esanai", "Ilanthakudi","Irur", "Kalpadi", "Kaikalathur", "Kunnam", "Kurumbalur", "Labbaikudikadu", "Melapuliyur", "Nakkasalem", "Padalur", "Perali", "Perambalur", "Siruvachur",  "V.Kalathur", "Varadharajanpettai", "Veppur", "Vengalam","Varatharajanpettai"],
"Karur":["Aravakurichi","InamKarur","K.Paramathi","Karur","Krishnarayapuram","Kulithalai","Musiri","Pallapatti","Pettavaithalai","Pugalur","Thanthoni","Thogamalai","Vengamedu"],
"Nilgiris":["Cherangode","Coonoor","Gudalur","Ketti","Kotagiri","Melur","Naduvattam","Nelliyalam","Pandalur","Sholur","Udhagamandalam","Welington","Yedappali"],
"Pudukottai":["Alangudi","Aranthangi","Arimalam","Avudaiyarkoil","Gandarvakottai","Illuppur","Karambakudi","Keeranur","Kottaipattinam","Kothamangalam","Manamelkudi","Mankottai","Pallathividuthi","Ponnamaravathi","Pudukkottai","Thirumayam","Viralimalai"],
"Tenkasi":["Alangulam","Courtallam","Kadayanallur","Melagaram","Mukkuddal","Panpoli","Pavoorchatram","Perumalpatti","Puliyangudi","SankaranKoil","Sengottai","Sivagiri","Sundarapandiapuram","Surandai","Tenkasi","Thiruvengadam","Vasudevanallur"],
"Thoothukudi":["Arumuganeri","Eral","Ettayapuram","Kalugumalai","Kayalpattinam","Kayathur","Kovilpatti","Nazareth","Ottapidaram","Sathankulam","Srivaikuntam","Subramaniyapuram","Tiruchendur","Thoothukudi","Vilathikulam"],
"Mayiladuthurai":["Achalpuram","Arasangudi","Arasur","Kottuchery","Kuthalam","Manalmedu","Mayiladuthurai","Melaperumpallam","Nalladai","Nidur","Poombuhar","Poraiyar","Sembanarkoil","Sirkazhi","Sitharkadu","Tharangampadi","Thirukadaiyur","Thirunagari","Thiruvalangadu","Vaitheeswarankoil"],
"Ranipet":["Arakkonam","Arcot","Banavaram","Kalavai","Kalinjur","Kaveripakkam","Melvisharam","Mambakkam","Nemili","Ponnai","Ranipet","Semmur","Sholinghur","Thenkadappanthangal","Thiruparkadal","Vilapakkam"],
"Tirupattur":["Alangayam","Ambur","Jolarpet","Kandili","Kavalur","Koothur","Madhanur","Melsanankuppam","Natrampalli","Pachal","Tirupattur","Udayendiram","Valayampattu","Vaniyambadi","Veppalampatti"],
"Dindigul": ["Ambaturai", "Athoor", "Chinnalapatti", "Dindigul", "Kodaikanal", "Kannivadi", "Natham", "Nilakottai", "Oddanchatram", "Palani", "Pattiveeranpati", "Perumalmalai", "Sembatti", "Vadamadurai", "Vedasandur", "Vatlagundu"],
"Kallakurichi": ["Arakandanallur", "Chinnasalem", "KalvarayanHills", "Kallakurichi", "Mangalampattu", "Mugaiyur", "Perumbakkam", "Pukkiravari", "Puthupalayam", "Rishivandiyam", "Sankarapuram", "Thiruvarangam", "Tirukkoyilur", "Ulundurpettai"]
};

const SignUp = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultRole = queryParams.get("role") || ""; // Default empty, user must select

  const [formData, setFormData] = useState({
    username: '', role: '', typeofDonor: '',restaurantName: '',organizationName:'',
    charityName: '', charityRegNo: '', address: '', district: '', city: '', pincode: '',
    contact: '', email: '', password: '', confirmPassword: '',profilepic: ''
  });
  const [errors, setErrors] = useState({});
  const [filteredCities, setFilteredCities] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (defaultRole) {
      setFormData((prev) => ({ ...prev, role: defaultRole }));
    }
  }, [defaultRole]); // Runs when component mounts or URL changes


  const handlePrivacyCheck = () => {
    setPrivacyChecked(!privacyChecked);
  };


  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setProfilePicFile(file); // ✅ Store file for Cloudinary upload
        setPreviewImage(URL.createObjectURL(file)); 
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
  
    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
  
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
  
          if (data.display_name) {
            setFormData((prevData) => ({
              ...prevData,
              address: data.display_name,
            }));
          } else {
            alert("Location detected, but no address found.");
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Failed to fetch address.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to fetch location. Please enter manually.");
        setLoadingLocation(false);
      }
    );
  };  

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => {
        let updatedFormData = { ...prevFormData, [name]: value };

        // Role change → Reset other fields
        if (name === "role") {
            updatedFormData = {
                ...updatedFormData,
                typeofDonor: "",
                restaurantName: "",
                organizationName:"",
                charityName: "",
                charityRegNo: ""
            };
        }

        // If donor type is restaurant → Keep restaurant name, else clear it
        if (name === "typeofDonor") {
            updatedFormData = {
                ...updatedFormData,
                restaurantName: value === "Restaurant" ? prevFormData.restaurantName : "",
                organizationName: value === "Organization" ? prevFormData.organizationName : ""
            };
        }

        console.log("Updated formData:", updatedFormData); // ✅ Debugging log
        return updatedFormData; // 🔥 Update state correctly
    });

    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); 
};


  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setFormData({ ...formData, district: selectedDistrict, city: '' });
    setFilteredCities(cityData[selectedDistrict] || []);

    setErrors((prevErrors) => ({ ...prevErrors, district: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.role) newErrors.role = 'Please select a user role';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.city) newErrors.city = 'City is required';

    if(formData.role === 'Donor')
    {
        if (!formData.typeofDonor) {
            newErrors.typeofDonor = 'Please select a type of Donor';
        }
        if (formData.typeofDonor === "Restaurant" && !formData.restaurantName) {
            newErrors.restaurantName = 'Restaurant Name is required';
        }
        if (formData.typeofDonor === "Organization" && !formData.organizationName) {
            newErrors.organizationName = 'Organization Name is required';
        }
    }

    if(formData.role === 'Recipient'){
        if (!formData.charityName) {
            newErrors.charityName = 'Please enter a charity name';
        }
        if (!formData.charityRegNo) {
            newErrors.charityRegNo = 'Please enter a charity Reg. no';
        }
    }

    if (!formData.pincode) {
        newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'Invalid pincode. Must be 6 digits.';
    }
    if (!formData.contact) {
        newErrors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contact)) {
        newErrors.contact = 'Invalid phone number. Must be exactly 10 digits.';
    }
    // ✅ Email Validation (Proper Format)
    if (!formData.email) {
        newErrors.email = 'Email is required';
    } 
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
    const uploadToCloudinary = async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

        try {
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                data
            );
            return response.data.secure_url; // ✅ Return image URL
        } catch (error) {
            console.error("Cloudinary Upload Error:", error.response?.data || error.message);
            return null; // Handle error
        }
    };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const email = formData.email;
    
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const emailRef=ref(database,"emails");
            const snapshot=await get(emailRef);
            const nextKey=snapshot.exists()?Object.keys(snapshot.val()).length+1:1;

            
            let profilePicUrl = "";
            
            // ✅ Upload profile picture only if it's selected
            if (profilePicFile) {
                profilePicUrl = await uploadToCloudinary(profilePicFile);
            }
            else
                profilePicUrl= "https://res.cloudinary.com/dqe76a7cx/image/upload/v1741154867/illustration-of-human-icon-user-symbol-icon-modern-design-on-blank-background-free-vector_zllzmk.jpg";
    
            // ✅ Save user data in Firebase Realtime Database
            await set(ref(database, `${formData.role.toLowerCase()}/${user.uid}`), {
                uid: user.uid,
                username: formData.username,
                role: formData.role,
                address: formData.address,
                district: formData.district,
                city: formData.city,
                pincode: formData.pincode,
                contact: formData.contact,
                email: formData.email,
                profilePic: profilePicUrl, 
                lat:latitude,
                lon:longitude,
                emailVerified:false,
                createdAt: new Date().toISOString(),
                
                
                // ✅ Donor specific fields
                ...(formData.role === "Donor" && { 
                    typeofDonor: formData.typeofDonor,
                    ...(formData.typeofDonor === "Restaurant" && { restaurantName: formData.restaurantName }),
                    ...(formData.typeofDonor === "Organization" && { organizationName: formData.organizationName }) // 🆕 Added
                }),
                
                // ✅ Recipient specific fields
                ...(formData.role === "Recipient" && {
                    charityName: formData.charityName,
                    charityRegNo: formData.charityRegNo
                })
            });

            await set(ref(database, `emails/${nextKey}`),email);
            // Send email verification
            await sendEmailVerification(user);
            
            Swal.fire({
              icon: 'success',
              title: 'Verification Email Sent!',
              text: 'Please check your inbox to verify your account.',
              confirmButtonColor: '#3085d6',
            });
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            setErrors((prevErrors) => ({ ...prevErrors, general: err.message })); // ✅ Fix error handling
        }
    };    

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
        <form onSubmit={handleSignUp}>
          {/* Username */}
          <div className="mb-4">
            <input type="text" name="username" placeholder="Name" value={formData.username} onChange={handleChange} className="w-full p-2 border rounded" />
            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
          </div>

          {/* Role */}
          <div>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 mb-4 border rounded">
            <option value="">Select Role</option>
            <option value="Donor">Donor</option>
            <option value="Recipient">Recipient</option>
            <option value="Volunteer">Volunteer</option>
          </select>
          {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
        </div>

          {formData.role === "Donor" && (
            <div>
            <select name="typeofDonor" value={formData.typeofDonor} onChange={handleChange} className="w-full p-2 mb-4 border rounded">
                <option value="">Select Type of Donor</option>
                <option value="Individual">Individual</option>
                <option value="Organization">Organization</option>
                <option value="Restaurant">Restaurant</option>
            </select>
            {errors.typeofDonor && <p className="text-red-500 text-sm">{errors.typeofDonor}</p>}
            </div>
        )}

        {formData.typeofDonor === "Restaurant" && (
            <div>
            <input type="text" name="restaurantName" placeholder="Restaurant Name" value={formData.restaurantName} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
            {errors.restaurantName && <p className="text-red-500 text-sm">{errors.restaurantName}</p>}
            </div>
        )}

        {formData.typeofDonor === "Organization" && (
            <div>
            <input type="text" name="organizationName" placeholder="Organization Name" value={formData.organizationName} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
            {errors.organizationName && <p className="text-red-500 text-sm">{errors.organizationName}</p>}
            </div>
        )}

        {formData.role === "Recipient" && (
            <div>
                <input type="text" name="charityName" placeholder="Charity Name" value={formData.charityName} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
                {errors.charityName && <p className="text-red-500 text-sm">{errors.charityRegNo}</p>}
                <input type="text" name="charityRegNo" placeholder="Charity Registration Number" value={formData.charityRegNo} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
                {errors.charityName && <p className="text-red-500 text-sm">{errors.charityName}</p>}
            </div>
        )}

          {/* Address Field with Auto-Detect (Fixed UI) */}
          <div className="mb-4 relative">
              <input
                  type="text"
                  name="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full p-3 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              />
              <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-600 transition"
                  onClick={getUserLocation}
                  disabled={loadingLocation}
              >
                  {loadingLocation ? "Detecting..." : "Auto Detect"}
              </button>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>


          {/* District & City */}
          <div>
          <select name="district" value={formData.district} onChange={handleDistrictChange} className="w-full p-2 mb-4 border rounded">
            <option value="">Select District</option>
            {tamilNaduDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.district && <p className="text-red-500 text-sm">{errors.district}</p>}
          </div>

        <div>
          <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 mb-4 border rounded">
            <option value="">Select City</option>
            {filteredCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
        </div>

          {/* Pincode */}
          <div className="mb-4">
            <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} className="w-full p-2 border rounded" />
            {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
          </div>

          {/* Contact */}
        <div className="mb-4 flex items-center border rounded overflow-hidden">
            <span className="bg-gray-200 p-2 text-gray-700 border-r">+91</span>
            <input type="text" name="contact" placeholder="Contact Number" value={formData.contact} onChange={handleChange} className="w-full p-2 border-none outline-none"/>
        </div>
            {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}


          {/* Email */}
          <div className="mb-4">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

           {/* Password */}
        {/* Password Field */}
        <div className="mb-4">
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        {/* Confirm Password Field */}
        <div className="mb-4">
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-2 border rounded" />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-center mb-4">
            <label className="cursor-pointer flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <PlusCircleIcon className="w-12 h-12 text-gray-500" />
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                Choose Profile
            </label>

             {/* ✅ Show preview if an image is selected */}
             {previewImage && (
                <img src={previewImage} alt="Profile Preview" className="w-16 h-16 ml-10 rounded-full object-cover border" />
            )}
        </div>
        {/* Privacy Policy & Email Verification Checkbox */}
        <div className="mb-4">
        <input
            type="checkbox"
            id="privacyPolicy"
            checked={privacyChecked}
            onChange={handlePrivacyCheck}
            className="mr-2"
        />
        <label htmlFor="privacyPolicy">
            I agree to the <a href="/privacy-policy" className="text-blue-600">Privacy Policy</a> and verify your email ID once again.
        </label>
        </div>
        
        {errors.general && <p className="text-red-500 mb-4 text-center">{errors.general}</p>}

        {/* Signup Button (Disabled until Checkbox is checked) */}
        <button
        type="submit"
        className={`w-full p-2 rounded ${!privacyChecked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        disabled={!privacyChecked}
        >
        Sign Up
        </button>
        </form>
        <p className="mt-4 text-sm text-center">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;