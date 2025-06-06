/**
 * 更新日期：2024-04-05 15:30:15 (模拟原始日期，实际已修改)
 * 用法：Sub-Store 脚本操作添加
 * rename.js 以下是此脚本支持的参数，必须以 # 为开头多个参数使用"&"连接，参考上述地址为例使用参数。 禁用缓存url#noCache
 *
 *** 主要参数
 * [in=] 自动判断机场节点名类型 优先级 zh(中文) -> flag(国旗) -> quan(英文全称) -> en(英文简写)
 * [out=] 输出节点名可选参数: (cn或zh ，us或en ，gq或flag ，quan) 对应：(中文，英文缩写 ，国旗 ，英文全称) 默认中文
 *** 分隔符参数
 * [fgf=] 节点名前缀或国旗分隔符，默认为空格
 * [sn=]  设置国家与序号之间的分隔符，默认为空格
 *** 序号参数
 * [one]    清理只有一个节点的地区的01
 * [flag]   给节点前面加国旗
 *** 前缀参数 (Note: These can be overridden by SCRIPT_DEFAULT_PREFIX below if SCRIPT_DEFAULT_PREFIX is not empty)
 * [name=]  节点添加机场名称前缀
 * [nf]     把 name= 的前缀值放在最前面
 *** 保留参数
 * [blkey=iplc+gpt+NF+IPLC] 用+号添加多个关键词 保留节点名的自定义字段 (例如 blkey=IPv4+IPv6)
 * ... (其他参数说明)
 */

const inArg = $arguments; 
const nx = inArg.nx || false,
  bl = inArg.bl || false,
  // nf and FNAME will be determined later based on SCRIPT_DEFAULT_PREFIX and URL params
  key = inArg.key || false,
  blgd = inArg.blgd || false,
  blpx = inArg.blpx || false,
  blnx = inArg.blnx || false,
  numone = inArg.one || false,
  debug = inArg.debug || false,
  clear = inArg.clear || false,
  addflag = inArg.flag || false,
  nm = inArg.nm || false;

// ****** START: CUSTOMIZE YOUR DEFAULT PREFIX HERE ******
const SCRIPT_DEFAULT_PREFIX = "LinuxDo-"; // <-- EDIT THIS VALUE for your desired prefix. Set to "" to not use a script-defined default.
const SCRIPT_DEFAULT_PREFIX_AT_FRONT = true;    // true = prefix at very start; false = after flag, before region
// ****** END: CUSTOMIZE YOUR DEFAULT PREFIX HERE ******

const FGF = inArg.fgf == undefined ? " " : decodeURI(inArg.fgf),
  XHFGF = inArg.sn == undefined ? " " : decodeURI(inArg.sn),   
  BLKEY = inArg.blkey == undefined ? "" : decodeURI(inArg.blkey),
  blockquic = inArg.blockquic == undefined ? "" : decodeURI(inArg.blockquic);

// Determine final FNAME and nf to use:
// If SCRIPT_DEFAULT_PREFIX is set in the script and not empty, it's used.
// Otherwise, use values from URL parameters (if provided).
let FNAME_to_use = "";
let nf_to_use = false;

const nameFromURL = inArg.name == undefined ? "" : decodeURI(inArg.name);
const nfFromURL = inArg.nf; // Can be "true", "false", or undefined

if (SCRIPT_DEFAULT_PREFIX && SCRIPT_DEFAULT_PREFIX !== "") {
  FNAME_to_use = SCRIPT_DEFAULT_PREFIX;
  nf_to_use = SCRIPT_DEFAULT_PREFIX_AT_FRONT;
  // If URL also provides 'name', it overrides script default (optional behavior, current logic: script default wins if set)
  // To make URL override script default:
  // if (nameFromURL !== "") { FNAME_to_use = nameFromURL; }
  // if (nfFromURL !== undefined) { nf_to_use = (nfFromURL === 'true' || nfFromURL === true); }

} else { // Script default prefix is empty, so rely on URL parameters
  FNAME_to_use = nameFromURL;
  if (nfFromURL !== undefined) {
    nf_to_use = (nfFromURL === 'true' || nfFromURL === true);
  } else {
    nf_to_use = false; // Default nf to false if not specified and no script default
  }
}


const nameMap = {
    cn: "cn", zh: "cn", us: "us", en: "us",
    quan: "quan", gq: "gq", flag: "gq",
  },
  inname = nameMap[inArg.in] || "",
  outputName = nameMap[inArg.out] || "";
// prettier-ignore
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇫','🇦🇱','🇩🇿','🇦🇴','🇦🇷','🇦🇲','🇦🇹','🇦🇿','🇧🇭','🇧🇩','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇫🇯','🇫🇮','🇬🇦','🇬🇲','🇬🇪','🇬🇭','🇬🇷','🇬🇱','🇬🇹','🇬🇳','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇨🇮','🇯🇲','🇯🇴','🇰🇿','🇰🇪','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇹','🇱🇺','🇲🇰','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇷','🇲🇺','🇲🇽','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇰🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇦','🇵🇾','🇵🇪','🇵🇭','🇵🇹','🇵🇷','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇸🇲','🇸🇦','🇸🇳','🇷🇸','🇸🇱','🇸🇰','🇸🇮','🇸🇴','🇿🇦','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇯','🇹🇿','🇹🇭','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇻🇮','🇺🇬','🇺🇦','🇺🇾','🇺🇿','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼','🇦🇩','🇷🇪','🇵🇱','🇬🇺','🇻🇦','🇱🇮','🇨🇼','🇸🇨','🇦🇶','🇬🇮','🇨🇺','🇫🇴','🇦🇽','🇧🇲','🇹🇱', '➡️'];
// prettier-ignore
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AF','AL','DZ','AO','AR','AM','AT','AZ','BH','BD','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CO','KM','CG','CD','CR','HR','CY','CZ','DK','DJ','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','GA','GM','GE','GH','GR','GL','GT','GN','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','CI','JM','JO','KZ','KE','KW','KG','LA','LV','LB','LS','LR','LY','LT','LU','MK','MG','MW','MY','MV','ML','MT','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NP','NL','NZ','NI','NE','NG','KP','NO','OM','PK','PA','PY','PE','PH','PT','PR','QA','RO','RU','RW','SM','SA','SN','RS','SL','SK','SI','SO','ZA','ES','LK','SD','SR','SZ','SE','CH','SY','TJ','TZ','TH','TG','TO','TT','TN','TR','TM','VI','UG','UA','UY','UZ','VE','VN','YE','ZM','ZW','AD','RE','PL','GU','VA','LI','CW','SC','AQ','GI','CU','FO','AX','BM','TL', 'Direct'];
// prettier-ignore
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','阿富汗','阿尔巴尼亚','阿尔及利亚','安哥拉','阿根廷','亚美尼亚','奥地利','阿塞拜疆','巴林','孟加拉国','白俄罗斯','比利时','伯利兹','贝宁','不丹','玻利维亚','波斯尼亚和黑塞哥维那','博茨瓦纳','巴西','英属维京群岛','文莱','保加利亚','布基纳法索','布隆迪','柬埔寨','喀麦隆','加拿大','佛得角','开曼群岛','中非共和国','乍得','智利','哥伦比亚','科摩罗','刚果(布)','刚果(金)','哥斯达黎加','克罗地亚','塞浦路斯','捷克','丹麦','吉布提','多米尼加共和国','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚','埃塞俄比亚','斐济','芬兰','加蓬','冈比亚','格鲁吉亚','加纳','希腊','格陵兰','危地马拉','几内亚','圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印尼','伊朗','伊拉克','爱尔兰','马恩岛','以色列','意大利','科特迪瓦','牙买加','约旦','哈萨克斯坦','肯尼亚','科威特','吉尔吉斯斯坦','老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','立陶宛','卢森堡','马其顿','马达加斯加','马拉维','马来','马尔代夫','马里','马耳他','毛利塔尼亚','毛里求斯','墨西哥','摩尔多瓦','摩纳哥','蒙古','黑山共和国','摩洛哥','莫桑比克','缅甸','纳米比亚','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚','朝鲜','挪威','阿曼','巴基斯坦','巴拿马','巴拉圭','秘鲁','菲律宾','葡萄牙','波多黎各','卡塔尔','罗马尼亚','俄罗斯','卢旺达','圣马力诺','沙特阿拉伯','塞内加尔','塞尔维亚','塞拉利昂','斯洛伐克','斯洛文尼亚','索马里','南非','西班牙','斯里兰卡','苏丹','苏里南','斯威士兰','瑞典','瑞士','叙利亚','塔吉克斯坦','坦桑尼亚','泰国','多哥','汤加','特立尼达和多巴哥','突尼斯','土耳其','土库曼斯坦','美属维尔京群岛','乌干达','乌克兰','乌拉圭','乌兹别克斯坦','委内瑞拉','越南','也门','赞比亚','津巴布韦','安道尔','留尼汪','波兰','关岛','梵蒂冈','列支敦士登','库拉索','塞舌尔','南极','直布罗陀','古巴','法罗群岛','奥兰群岛','百慕达','东帝汶', '直连'];
// prettier-ignore
const QC = ['Hong Kong','Macao','Taiwan','Japan','Korea','Singapore','United States','United Kingdom','France','Germany','Australia','Dubai','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Virgin Islands','Brunei','Bulgaria','Burkina-faso','Burundi','Cambodia','Cameroon','Canada','CapeVerde','CaymanIslands','Central African Republic','Chad','Chile','Colombia','Comoros','Congo-Brazzaville','Congo-Kinshasa','CostaRica','Croatia','Cyprus','Czech Republic','Denmark','Djibouti','Dominican Republic','Ecuador','Egypt','EISalvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','Gabon','Gambia','Georgia','Ghana','Greece','Greenland','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Isle of Man','Israel','Italy','Ivory Coast','Jamaica','Jordan','Kazakstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar(Burma)','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','NorthKorea','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Portugal','PuertoRico','Qatar','Romania','Russia','Rwanda','SanMarino','SaudiArabia','Senegal','Serbia','SierraLeone','Slovakia','Slovenia','Somalia','SouthAfrica','Spain','SriLanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syria','Tajikstan','Tanzania','Thailand','Togo','Tonga','TrinidadandTobago','Tunisia','Turkey','Turkmenistan','U.S.Virgin Islands','Uganda','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Andorra','Reunion','Poland','Guam','Vatican','Liechtensteins','Curacao','Seychelles','Antarctica','Gibraltar','Cuba','Faroe Islands','Ahvenanmaa','Bermuda','Timor-Leste', 'Direct'];

const specialRegex = [ /(\d\.)?\d+×/, /IPLC|IEPL|Kern|Edge|Pro|Std|Exp|Biz|Fam|Game|Buy|Zx|LB|Game/,];
const nameclear = /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|备用|群|TEST|客服|网站|获取|订阅|流量|机场|下次|官址|联系|邮箱|工单|学术|USE|USED|TOTAL|EXPIRE|EMAIL)/i;
const regexArray=[/ˣ²/, /ˣ³/, /ˣ⁴/, /ˣ⁵/, /ˣ⁶/, /ˣ⁷/, /ˣ⁸/, /ˣ⁹/, /ˣ¹⁰/, /ˣ²⁰/, /ˣ³⁰/, /ˣ⁴⁰/, /ˣ⁵⁰/, /IPLC/i, /IEPL/i, /核心/, /边缘/, /高级/, /标准/, /实验/, /商宽/, /家宽/, /游戏|game/i, /购物/, /专线/, /LB/, /cloudflare/i, /\budp\b/i, /\bgpt\b/i,/udpn\b/];
const valueArray= [ "2×","3×","4×","5×","6×","7×","8×","9×","10×","20×","30×","40×","50×","IPLC","IEPL","Kern","Edge","Pro","Std","Exp","Biz","Fam","Game","Buy","Zx","LB","CF","UDP","GPT","UDPN"];
const nameblnx = /(高倍|(?!1)2+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const namenx = /(高倍|(?!1)(0\.|\d)+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const keya = /港|Hong|HK|新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR|🇸🇬|🇭🇰|🇯🇵|🇺🇸|🇰🇷|🇹🇷/i;
const keyb = /(((1|2|3|4)\d)|(香港|Hong|HK) 0[5-9]|((新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR) 0[3-9]))/i;
const rurekey = { GB: /UK/g,"B-G-P": /BGP/g, "Russia Moscow": /Moscow/g,"Korea Chuncheon": /Chuncheon|Seoul/g,"Hong Kong": /Hongkong|HONG KONG/gi,"United Kingdom London": /London|Great Britain/g,"Dubai United Arab Emirates": /United Arab Emirates/g,"Taiwan TW 台湾 🇹🇼": /(台|Tai\s?wan|TW).*?🇨🇳|🇨🇳.*?(台|Tai\s?wan|TW)/g,"United States": /USA|Los Angeles|San Jose|Silicon Valley|Michigan/g,澳大利亚: /澳洲|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/g,德国: /(深|沪|呼|京|广|杭)德(?!.*(I|线))|法兰克福|滬德/g,香港: /(深|沪|呼|京|广|杭)港(?!.*(I|线))/g,日本: /(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))|东京|大坂/g,新加坡: /狮城|(深|沪|呼|京|广|杭)新/g,美国: /(深|沪|呼|京|广|杭)美|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|芝加哥/g,波斯尼亚和黑塞哥维那: /波黑共和国/g,印尼: /印度尼西亚|雅加达/g,印度: /孟买/g,阿联酋: /迪拜|阿拉伯联合酋长国/g,孟加拉国: /孟加拉/g,捷克: /捷克共和国/g,台湾: /新台|新北|台(?!.*线)/g,Taiwan: /Taipei/g,韩国: /春川|韩|首尔/g,Japan: /Tokyo|Osaka/g,英国: /伦敦/g,India: /Mumbai/g,Germany: /Frankfurt/g,Switzerland: /Zurich/g,俄罗斯: /莫斯科/g,土耳其: /伊斯坦布尔/g,泰国: /泰國|曼谷/g,法国: /巴黎/g,G: /\d\s?GB/gi,Esnc: /esnc/gi,};

let GetK = false, AMK = []
function ObjKA(i) { GetK = true; AMK = Object.entries(i); }

function operator(pro) { 
  const Allmap = {};
  const outList = getList(outputName);
  let inputList;
  let retainKey = ""; 

  if (inname !== "") { inputList = [getList(inname)]; } 
  else { inputList = [ZH, FG, QC, EN]; }

  inputList.forEach((arr) => { arr.forEach((value, valueIndex) => { Allmap[value] = outList[valueIndex]; }); });

  if (clear || nx || blnx || key) { /* ... filtering logic ... */ }

  const BLKEYS = BLKEY ? BLKEY.split("+") : ""; 

  pro.forEach((e) => { 
    let bktf = false;
    const ens = e.name; 
    retainKey = ""; 

    Object.keys(rurekey).forEach((ikey_rure) => {
      if (rurekey[ikey_rure].test(e.name)) {
        e.name = e.name.replace(rurekey[ikey_rure], ikey_rure);
        if (BLKEY) {
          bktf = true; 
          let BLKEY_REPLACE_VAL = "";
          let re_val = false;
          BLKEYS.forEach((i) => {
            const parts = i.split(">");
            const keywordToMatch = parts[0];
            const replacement = parts[1];
            if (ens.includes(keywordToMatch)) { 
              if (replacement !== undefined) { 
                BLKEY_REPLACE_VAL = replacement;
                re_val = true;
              }
            }
          });
          if (re_val) {
            retainKey = BLKEY_REPLACE_VAL;
          } else {
            const tempRetainKeys = BLKEYS.filter((item) => !item.includes(">") && ens.includes(item));
            if (tempRetainKeys.length > 0) {
              retainKey = tempRetainKeys.join(" "); 
            }
          }
        }
      }
    });

    if (blockquic == "on") { e["block-quic"] = "on"; } 
    else if (blockquic == "off") { e["block-quic"] = "off"; } 
    else { delete e["block-quic"]; }

    if (!bktf && BLKEY) {
      let BLKEY_REPLACE_VAL = "";
      let re_val = false;
      BLKEYS.forEach((i) => {
        const parts = i.split(">");
        const keywordToMatch = parts[0];
        const replacement = parts[1];
        if (ens.includes(keywordToMatch)) { 
          if (replacement !== undefined) {
            BLKEY_REPLACE_VAL = replacement;
            re_val = true;
          }
        }
      });
      if (re_val) {
        retainKey = BLKEY_REPLACE_VAL;
      } else {
        const tempRetainKeys = BLKEYS.filter((item) => !item.includes(">") && ens.includes(item));
        if (tempRetainKeys.length > 0) {
          retainKey = tempRetainKeys.join(" ");
        }
      }
    }

    let ikey_bl = ""; 
    let ikeys_blgd = "";
    if (blgd) { /* ... blgd logic ... */ }
    if (bl) { /* ... bl logic ... */ }

    !GetK && ObjKA(Allmap);
    const findKey = AMK.find(([key_map]) => e.name.includes(key_map));
    
    let firstName = ""; 
    let nNames = "";    

    // Use the determined FNAME_to_use and nf_to_use from the top
    if (nf_to_use) { 
      firstName = FNAME_to_use; 
    } else {
      nNames = FNAME_to_use;
    }

    if (findKey?.[1]) { 
      const findKeyValue = findKey[1]; 
      let keyover = [];
      let usflag = "";
      if (addflag) { /* ... flag logic ... */ }
      
      keyover = keyover
        .concat(firstName, usflag, nNames, findKeyValue, retainKey, ikey_bl, ikeys_blgd)
        .filter((k_item) => k_item !== "" && k_item !== undefined && k_item !== null); 
      e.name = keyover.join(FGF); 
    } else { 
      if (nm) { 
        if (nf_to_use) { e.name = firstName + FGF + e.name; } 
        else { e.name = nNames + FGF + e.name; }
      } else { e.name = null; }
    }
  });
  pro = pro.filter((e) => e.name !== null); 
  jxh(pro); 
  numone && oneP(pro); 
  blpx && (pro = fampx(pro)); 
  key && (pro = pro.filter((e) => !keyb.test(e.name))); 
  return pro; 
}

// Ensure these functions are fully defined as in previous complete versions
function getList(arg) { switch (arg) { case 'us': return EN; case 'gq': return FG; case 'quan': return QC; default: return ZH; }}
function jxh(e) { const n = e.reduce((e_acc, n_proxy) => { const t = e_acc.find((item) => item.name === n_proxy.name); if (t) { t.count++; t.items.push({ ...n_proxy, name: `${n_proxy.name}${XHFGF}${t.count.toString().padStart(2, "0")}`, }); } else { e_acc.push({ name: n_proxy.name, count: 1, items: [{ ...n_proxy, name: `${n_proxy.name}${XHFGF}01` }], }); } return e_acc; }, []);const t_flat=(typeof Array.prototype.flatMap==='function'?n.flatMap((item) => item.items):n.reduce((acc, item) => acc.concat(item.items),[])); e.splice(0, e.length, ...t_flat); return e;}
function oneP(e) { const t = e.reduce((e_acc, t_proxy) => { const n_baseName = t_proxy.name.replace(new RegExp(escapeRegExp(XHFGF) + "\\d+$"), ""); if (!e_acc[n_baseName]) { e_acc[n_baseName] = []; } e_acc[n_baseName].push(t_proxy); return e_acc; }, {}); for (const e_key in t) { if (t[e_key].length === 1 && t[e_key][0].name.endsWith(XHFGF + "01")) { t[e_key][0].name = t[e_key][0].name.replace(new RegExp(escapeRegExp(XHFGF) + "01$"), ""); } } return e; }
function fampx(pro) { const wis = []; const wnout = []; for (const proxy of pro) { const fan = specialRegex.some((regex) => regex.test(proxy.name)); if (fan) { wis.push(proxy); } else { wnout.push(proxy); } } const sps = wis.map((proxy) => specialRegex.findIndex((regex) => regex.test(proxy.name)) ); wis.sort( (a, b) => sps[wis.indexOf(a)] - sps[wis.indexOf(b)] || a.name.localeCompare(b.name) ); wnout.sort((a, b) => pro.indexOf(a) - pro.indexOf(b)); return wnout.concat(wis);}
function escapeRegExp(string) { if (typeof string !== 'string') { return ''; } return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');}
