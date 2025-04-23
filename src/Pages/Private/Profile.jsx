import React, { useEffect, useState } from 'react';
import { auth, database } from '../../firebase';
import { ref, get, update,set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import FeedBack from "../Private/FeedBack";
import axios from 'axios';
import Swal from 'sweetalert2';

const CLOUDINARY_UPLOAD_PRESET = 'profile_picture';
const CLOUDINARY_CLOUD_NAME = 'dqe76a7cx';

const tamilNaduDistricts = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi",
    "Kancheepuram", "Karur", "Krishnagiri", "Kanyakumari","Madurai","Mayiladuthurai", "Nagapattinam", "Namakkal","Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivagangai", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli",
    "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Thiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ];
  
  const citiesByDistrict = {
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
"Nagapattinam": ["Keelvelur", "Kodiyakarai", "Manjakollai", "Nagapattinam", "Nagore", "Thalanayar", "Thittachery","Thirukkuvalai", "Vedaranyam", "sikkal","Velankanni"],
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

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState("donation");
  const [currentDonationId, setCurrentDonationId] = useState(null);

  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    contact: '',
    pincode: '',
  });

  const checkAllDonationFeedbacks = async (userId) => {
    const feedbackRefs = [
      { path: "donation_feedback", type: "donation" },
      { path: "request_feedback", type: "request" },
    ];
  
    for (const refInfo of feedbackRefs) {
      const feedbackRef = ref(database, refInfo.path);
      const snapshot = await get(feedbackRef);
      const allFeedbacks = snapshot.val();
  
      if (!allFeedbacks) continue;
  
      for (const itemId in allFeedbacks) {
        const userFeedback = allFeedbacks[itemId][userId];
        if (userFeedback && userFeedback.status !== "submitted" && userFeedback.status !== "rejected") {
          setCurrentDonationId(itemId); // reuse same variable for ID
          setFeedbackType(refInfo.type); // store whether it's a donation or request
          setShowModal(true);
          return; // show only one modal at a time
        }
      }
    }
  };

  const handleFeedbackSubmit = async ({ rating, feedback, status = "submitted" }) => {
    const userId = auth.currentUser?.uid;
    const donationId = currentDonationId;
  
    if (!donationId || !userId) return;
  
    const path = feedbackType === "request"
      ? `request_feedback/${donationId}/${userId}`
      : `donation_feedback/${donationId}/${userId}`;
  
    const feedbackRef = ref(database, path);
  
    await set(feedbackRef, {
      status,
      ...(status === "submitted" && { feedback, rating }),
      timestamp: new Date().toISOString(),
    });
  
    setShowModal(false);
  };  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAllDonationFeedbacks(user.uid);
        const userRef = ref(database, `donor/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (!snapshot.exists()) {
            get(ref(database, `recipient/${user.uid}`)).then((snap) => {
              if (!snap.exists()) {
                get(ref(database, `volunteer/${user.uid}`)).then((snapVol) => {
                  if (snapVol.exists()) setUserData(snapVol.val());
                });
              } else {
                setUserData(snap.val());
              }
            });
          } else {
            setUserData(snapshot.val());
          }
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userData) {
      setUpdatedData({
        username: userData.username || "",
        contact: userData.contact || "",
        address: userData.address || "",
        pincode: userData.pincode || "",
        district: userData.district || "",
        city: userData.city || "",
      });
      setFilteredCities(citiesByDistrict[userData.district] || []);
    }
  }, [userData]);

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setUpdatedData({ ...updatedData, district: selectedDistrict, city: '' });
    setFilteredCities(citiesByDistrict[selectedDistrict] || []);
  };

  const handleFileChange = (e) => {
    setProfilePicFile(e.target.files[0]);
  };

  const uploadToCloudinary = async (file) => {
    console.log("Uploading to Cloudinary...");
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    try {
      const response = await axios.post(
        `//api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        data
      );
      console.log("Upload Success:", response.data.secure_url);
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      return null;
    }
  };

  const validateFields = () => {
    let validationErrors = {};
    const phonePattern = /^[0-9]{10}$/;
    const pincodePattern = /^[1-9][0-9]{5}$/;
  
    if (!phonePattern.test(updatedData.contact)) {
      validationErrors.contact = 'Please enter a valid 10-digit phone number.';
    }
  
    if (!pincodePattern.test(updatedData.pincode)) {
      validationErrors.pincode = 'Please enter a valid 6-digit pincode.';
    }
  
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };


  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditMode(true);
  const handleCancelEdit = async () => {
    // Show SweetAlert confirmation dialog before canceling edit
    const result = await Swal.fire({
      title: 'Are you sure you want to cancel editing?',
      text: 'Any unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, keep editing',
    });
  
    // If user confirms, cancel edit and reset data
    if (result.isConfirmed) {
      setEditMode(false);
      setUpdatedData(userData);
      Swal.fire({
        title: 'Editing canceled',
        text: 'Your changes have been discarded.',
        icon: 'info',
        confirmButtonText: 'Okay',
        timer: 1000,
        showConfirmButton: false,
      });
    } else {
      // If user cancels the cancel action, nothing happens
      console.log('Edit operation kept active.');
    }
  };

  const handleDelete = () => {
    if (!userData) return;

    const userRef = ref(database, `${userData.role.toLowerCase()}/${userData.uid}`);
    
    remove(userRef)
        .then(() => {
            return deleteUser(userData);
        })
        .then(() => {
            alert("Account deleted successfully.");
            navigate('/');
        })
        .catch((error) => {
            console.error("Error deleting account:", error);
        });
  };

  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.style.overflow = "hidden"; // Prevent scrolling
    } else {
      document.body.style.overflow = "auto"; // Restore scrolling
    }
  }, [showDeleteConfirm]);

  const handleSave = async() => {
    
    if (!userData) return;

    if (!validateFields()) return;

    let profilePicUrl = userData.profilePic || ''; // Retain old pic if no new file
    let isProfilePicChanged = false; 
    if (profilePicFile) {
      console.log("Uploading new profile picture...");
      profilePicUrl = await uploadToCloudinary(profilePicFile);
      console.log("New Profile Pic URL:", profilePicUrl);
      isProfilePicChanged = true;
    }

    const updatedProfile = { ...updatedData, profilePic: profilePicUrl };
    const result = await Swal.fire({
      title: 'Are you sure you want to save these changes?',
      text: 'Please confirm to update your profile data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, save changes!',
      cancelButtonText: 'Cancel',
    });
  
    // Step 6: If confirmed, update the profile
    if (result.isConfirmed) {

    const userRef = ref(database, `${userData.role.toLowerCase()}/${userData.uid}`);
    update(userRef, updatedProfile).then(() => {
      setUserData({ ...userData, ...updatedProfile });
      setEditMode(false);
      if (isProfilePicChanged) {
       window.location.reload();  // ✅ Refresh the page only if the profile picture changed
      }
      Swal.fire({
        title: 'Profile Updated!',
        text: 'Your profile has been updated successfully.',
        icon: 'success',
        confirmButtonText: "Great!",
        timer: 4000,
        showConfirmButton: false,
      });
    }) .catch((error) => {
      // Handle error during the update
      console.error('Profile update failed:', error);
      Swal.fire({
        title: 'Update Failed',
        text: 'There was an issue saving your changes. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try Again',
      });
    });
  } else {
    // If user cancels the save operation
    console.log("Profile update cancelled.");
  }
  };

  return (
    <div
    className="min-h-screen   flex items-center justify-center bg-cover bg-center "
    //style={{ backgroundImage: url(${getBackground(userData?.role)}) }} // 🔥 Dynamic Background
  >

<FeedBack
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleFeedbackSubmit}
/>

    <div className="  bg-opacity-80 p-8 rounded-lg   w-full ">{/*container have a content}   
      {/* Profile Picture & Name Centered */}
      <h2 className="text-2xl font-semibold bg-none  text-center mb-4"></h2>
      {userData ? (
     <>
{/* 🔹 Banner Image */}
<div className="relative w-full h-55 lg:h-50  border-0 rounded-lg">
  <div className="w-full h-full border-2">

    {userData.role === "Donor" && (
      <div className="bg-gradient-to-r pb-6 lg:pt-6 from-orange-500 to-yellow-400 w-full h-full flex flex-col justify-center items-center">
        <strong><h1 className=" text-4xl lg:text-6xl text-center">DONOR</h1></strong>
        <p className="px-3 mt-2 mb-5 text-center text-lg lg:text-2xl">Your surplus is someone else's sustenance. Share the abundance.</p>
      </div>
    )}

    {userData.role === "Recipient" && (
      <div className="bg-gradient-to-r pb-6 lg:pt-6 from-pink-500 to-red-400 w-full h-full flex flex-col justify-center items-center">
        <strong><h1 className="text-4xl lg:text-6xl text-center">RECIPIENT</h1></strong>
        <p className="px-3 mt-2 lg:mt-3 mb-5 text-center text-lg lg:text-2xl">"Receiving hope, one meal at a time. You’re never alone."</p>
      </div>
    )}

    {userData.role === "Volunteer" && (
      <div className="bg-gradient-to-r pb-6 lg:pt-6 from-green-500 to-teal-400 w-full h-full flex flex-col justify-center items-center">
        <strong><h1 className="text-4xl lg:text-6xl text-center">VOLUNTEER</h1></strong>
        <p className="px-3 mt-2 lg:mt-3 mb-5 text-center text-lg lg:text-2xl">"Delivering more than food—delivering hope and change."</p>
      </div>
    )}

  </div>
  {/* 🔹 Profile Image (Fully Visible, Overlapping) */}
  <div className="relative mt-6">
  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12 md:left-10 md:translate-x-0 z-10">
  <img
    src={profilePicFile ? URL.createObjectURL(profilePicFile) : userData.profilePic || 'https://via.placeholder.com/100'} 
    alt="Profile"
    className="w-32 h-32 rounded-full border-3"
  />

       {/* 🔹 Edit Mode: "+" Upload Image Button (Positioned on the Profile Image) */}
    {editMode && (
      <div className="absolute bottom-0 right-0 mb-1   ml-10  z-20">
        <label className="cursor-pointer flex justify-center items-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-400 transition">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <span className="text-xl font-bold text-white">+</span>
        </label>
      </div>
    )}
    </div>

   
  </div>
  </div>

{/* 🔹 Username & Role */}
<div className="flex flex-col md:flex-row text-3xl md:text-2xl text-center md:text-left break-words -mb-6 mt-20 md:mt-4 md:ml-40 max-w-[400]">
  <div className="flex flex-col mb-7 md:ml-10 break-words overflow-hidden text-ellipsis items-center md:items-start">
    <>
      {/* Role-Specific Fields */}
        {editMode ? (
          <div className="max-w-[300px] items-center flex w-full">
            <input
              type="text"
              name="username"
              value={updatedData.username || userData.username}
              onChange={handleChange}
              className="border p-1 w-full lg:text-4xl text-3xl font-bold text-center max-w-[300px] truncate break-words rounded"
            />
          </div>
        ) : (
          <span className="truncate block max-w-[400px] lg:text-4xl text-3xl font-bold  items-center">{userData.username}</span>
        )}
      <p className="mb-7  mt-3 text-2xl font-semibold break-words">{userData.typeofDonor}</p>
    </>
  </div>
</div>
     
          {/* Main Content (Flex Layout) */}
          <div className="flex flex-col  md:flex-row gap-6">
  {/* Left Section - User Details */}
  <div className="w-full md:w-1/2 lg:text-xl bg-white/70 p-5 rounded-md shadow-sm border">
    <h3 className="font-semibold text-2xl text-blue-600 border-b pb-2 mb-3">📌 Contact</h3>

    <hr className="mb-3 border-blue-400" />
    
    {userData.role === 'Recipient' && (
      <>
        <div className="flex justify-between mb-2">
          <strong>Charity Name:</strong>
          <span>{userData.charityName || "Not provided"}</span>
        </div>
        <div className="flex justify-between mb-2">
          <strong>Charity Reg No:</strong>
          <span>{userData.charityRegNo || "Not provided"}</span>
        </div>
      </>
    )}

    {userData.role === "Donor" && (
      <>
        {userData.typeofDonor === "Organization" && (
          <div className="flex justify-between mb-2">
            <strong>Organization Name:</strong>
            <span>{userData.organizationName}</span>
          </div>
        )}
        {userData.typeofDonor === "Restaurant" && (
          <div className="flex justify-between mb-2">
            <strong>Restaurant Name:</strong>
            <span>{userData.restaurantName}</span>
          </div>
        )}
      </>
    )}

<div className="flex justify-between mb-2">
  <strong className="mb-1 sm:mb-0">📧Email:</strong>
  <span className="break-words sm:text-right">{userData.email || "Not provided"}</span>
</div>

    {/* Contact, Address, District, City, Pincode */}
    <div className="flex justify-between mb-2">
      <strong>📱Contact:</strong>
      {editMode ? (
        <input 
          type="text" 
          name="contact" 
          value={updatedData.contact || userData.contact} 
          onChange={handleChange} 
          className="border p-1 rounded" 
        />
      ) : (
        <span>{userData.contact}</span>
      )}
    </div>

    <div className="flex mb-4 items-start">
  <strong className="w-6 mt-1">🏠</strong>
  <div className="w-full flex justify-between">
    <span className="font-bold">Address:</span>
    {editMode ? (
      <textarea 
        name="address"
        rows={5}
        value={updatedData.address || userData.address}
        onChange={handleChange}
        className="border p-2 mt-1 ml-4 rounded resize-none w-full"
      />
    ) : (
      <p className="mt-1 whitespace-pre-line break-words text-right w-[80%]">
        {userData.address}
      </p>
    )}
  </div>
</div>

    <div className="flex justify-between mb-2">
      <strong>🏙District:</strong>
      {editMode ? (
        <select 
          name="district" 
          value={updatedData.district} 
          onChange={handleDistrictChange} 
          className="p-1 border rounded"
        >
          <option value="">Select District</option>
          {tamilNaduDistricts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      ) : (
        <span>{userData.district}</span>
      )}
    </div>

    <div className="flex justify-between mb-2">
      <strong>📍City:</strong>
      {editMode ? (
        <select 
          name="city" 
          value={updatedData.city} 
          onChange={handleChange} 
          className="border rounded p-1"
        >
          <option value="">Select City</option>
          {filteredCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <span>{userData.city}</span>
      )}
    </div>

    <div className="flex justify-between mb-2">
      <strong>📮Pincode:</strong>
      {editMode ? (
        <input 
          type="text" 
          name="pincode" 
          value={updatedData.pincode || userData.pincode} 
          onChange={handleChange} 
          className="border p-1 rounded" 
        />
      ) : (
        <span>{userData.pincode}</span>
      )}
    </div>
  </div>
            {/* Right Section - History (Smaller) */}
            <div className="w-full md:w-1/2 rounded-md bg-white/70 p-5 shadow-sm border"> 
  <h3 className="font-semibold text-2xl text-green-600 border-b pb-2 mb-3">📜 History</h3>
  <hr className="mb-2 border-green-500" />

  {userData.role === "Donor" && (
    <ul className="space-y-2 md:text-xl text-lg text-gray-700">
      <li>💰 Total Donation: <strong>{userData.donationCount || "N/A"}</strong></li>
      <li>🍽 Meals Donated: <strong>{userData.donationValue || "N/A"}</strong></li>
    </ul>
  )}

  {userData.role === "Recipient" && (
    <ul className="space-y-2 md:text-xl text-lg text-gray-700">
      <li>📥 Requests Made: <strong>{userData.foodRequests || "N/A"}</strong></li>
      <li>🎁 Donations Received: <strong>{userData.donationsReceived || "N/A"}</strong></li>
    </ul>
  )}

  {userData.role === "Volunteer" && (
    <ul className="space-y-2 md:text-xl text-lg text-gray-700">
      <li>🚚 Orders Delivered: <strong>{userData.ordersDelivered || "N/A"}</strong></li>
      {/* Optional */}
      {/* <li>📍 Distance Travelled: <strong>{userData.totalDistance || "N/A"} km</strong></li> */}
    </ul>
  )}
</div>
            </div>
            </>
      ) : (
        <p className="text-center text-gray-500">Loading...</p>
      )}
      
          <div className="mt-4 flex  justify-center">
               {/* Edit and Delete Buttons */}
               {editMode ? (
                <div className="mt-4 flex  justify-center">
                  <button  
                    onClick={handleSave} 
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                   💾
                   Save
                  </button>
                  <button 
                    onClick={handleCancelEdit} 
                    className="bg-gray-400 text-white px-4 py-2 ml-5 rounded hover:bg-gray-500"
                  >
                   ❌ Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between gap-3 mt-3">
                  <button 
                    onClick={() => setEditMode(true)} 
                    className="w-auto bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
                  >
                    ✏ Edit Profile
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="w-auto bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
                  >
                    🗑 Delete Account
                  </button>
                </div>
              )}
            </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <p className="mb-4">Are you sure you want to delete your account?</p>
            <button 
              onClick={handleDelete} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)} 
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Profile;