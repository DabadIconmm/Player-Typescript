// const { versions } = require("process");

var Dnv = Dnv || {};
Dnv.audiencia = Dnv.audiencia || {};

Dnv.audiencia.MODO_RELEYEBLE = 6;

Dnv.audiencia.modo = -1;

Dnv.audiencia.GENDER_MALE = 1;
Dnv.audiencia.GENDER_FEMALE = 2;
Dnv.audiencia.GENDER_UNKNOWN = 3;

Dnv.audiencia.AGE_CHILD = 1;
Dnv.audiencia.AGE_YOUNG = 2;
Dnv.audiencia.AGE_ADULT = 3;
Dnv.audiencia.AGE_SENIOR = 4;
Dnv.audiencia.AGE_UNKNOWN = 5;

Dnv.audiencia.AGE_GROUP_1 = 1;
Dnv.audiencia.AGE_GROUP_2 = 2;
Dnv.audiencia.AGE_GROUP_3 = 3;
Dnv.audiencia.AGE_GROUP_4 = 4;
Dnv.audiencia.AGE_GROUP_5 = 5;
Dnv.audiencia.AGE_GROUP_6 = 6;
Dnv.audiencia.AGE_GROUP_7 = 7;

Dnv.audiencia.EMOTION_NONE = 0;
Dnv.audiencia.EMOTION_AFR = 1;
Dnv.audiencia.EMOTION_ANG = 2;
Dnv.audiencia.EMOTION_DIS = 3;
Dnv.audiencia.EMOTION_HAP = 4;
Dnv.audiencia.EMOTION_NEU = 5;
Dnv.audiencia.EMOTION_SAD = 6;
Dnv.audiencia.EMOTION_SUR = 7;

Dnv.audiencia.tiempoImpacto;
Dnv.audiencia.objidPlayer;
Dnv.audiencia.ip;
Dnv.audiencia.puerto;

Dnv.audiencia.user = function(trackedface_id,
    gender,
    distance,
    age,
    ageGroup,
    ageRange,
    attentionTime,
    dwellTime,
    smilingTime,
    emotionalEngagementKPI,
    sentimentKPI,
    appearances,
    glasses,
    beard,
    lastEmotionAFR,
    lastEmotionANG,
    lastEmotionDIS,
    lastEmotionHAP,
    lastEmotionNEU,
    lastEmotionSAD,
    lastEmotionSUR
) {
    return {
        getTrackedface_id: function() { return trackedface_id; },
        getGender: function() { return gender; },
        getDistance: function() { return distance; },
        getAge: function() { return age; },
        getAgeGroup: function() { return ageGroup; },
        getAgeRange: function() { return ageRange; },
        getAttentionTime: function() { return attentionTime; },
        getDwellTime: function() { return dwellTime; },
        getSmilingTime: function() { return smilingTime; },
        getEmotionalEngagementKPI: function() { return emotionalEngagementKPI; },
        getSentimentKPI: function() { return sentimentKPI; },
        getAppearances: function() { return appearances; },
        getGlasses: function() { return glasses; },
        getBeard: function() { return beard; },
        getLastEmotionAFR: function() { return lastEmotionAFR; },
        getLastEmotionANG: function() { return lastEmotionANG; },
        getLastEmotionDIS: function() { return lastEmotionDIS; },
        getLastEmotionHAP: function() { return lastEmotionHAP; },
        getLastEmotionNEU: function() { return lastEmotionNEU; },
        getLastEmotionSAD: function() { return lastEmotionSAD; },
        getLastEmotionSUR: function() { return lastEmotionSUR; },
        getPredominantEmotion: function() {
            return Math.max(lastEmotionAFR, lastEmotionANG, lastEmotionDIS, lastEmotionHAP, lastEmotionNEU, lastEmotionSAD, lastEmotionSUR)
        }
    }
}

Dnv.audiencia.aparicion = function(time,
    trackedface_id,
    gender,
    age,
    dwellTime,
    atentionTime,
    afr,
    ang,
    dis,
    hap,
    neu,
    sad,
    sur,
    objidSlide,
    codCamp,
    coste,
    cumpleObjetivo,
    impacto
) {

    return {
        getTime: function() { return time; },
        getTrackedface_id: function() { return trackedface_id; },
        getGender: function() { return gender; },
        getAge: function() { return age; },
        getDwellTime: function() { return dwellTime; },
        getAttentionTime: function() { return atentionTime; },
        getAFR: function() { return afr; },
        getANG: function() { return ang; },
        getDIS: function() { return dis; },
        getHAP: function() { return hap; },
        getNEU: function() { return neu; },
        getSAD: function() { return sad; },
        getSUR: function() { return sur; },
        getObjidSlide: function() { return objidSlide; },
        getCodCamp: function() { return codCamp; },
        getCoste: function() { return coste },
        getCumpleObjetivoDemografico: function() { return cumpleObjetivo },
        isImpact: function() { return impacto },
        getFH: function() { return new Date(time).getHours(); },
        getDS: function() { return new Date(time).getDay(); },
        getID: function() { return time + "" + trackedface_id + "" + Dnv.audiencia.objidPlayer; },
        getPredominantEmotion: function() {

            var emotions = [afr, ang, dis, hap, neu, sad, sur];

            //switch (emotions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)) {
            switch (Dnv.utiles.getIndexOfMaxValue(emotions)) {
                case -1:
                    return Dnv.audiencia.EMOTION_NONE;
                case 0:
                    if (emotions[0] == 0) return Dnv.audiencia.EMOTION_NONE;
                    return Dnv.audiencia.EMOTION_AFR;
                    break;
                case 1:
                    return Dnv.audiencia.EMOTION_ANG;
                    break;
                case 2:
                    return Dnv.audiencia.EMOTION_DIS;
                    break;
                case 3:
                    return Dnv.audiencia.EMOTION_HAP;
                    break;
                case 4:
                    return Dnv.audiencia.EMOTION_NEU;
                    break;
                case 5:
                    return Dnv.audiencia.EMOTION_SAD;
                    break;
                case 6:
                    return Dnv.audiencia.EMOTION_SUR;
                    break;
            }

        },
        getAgeGroup: function() {
            if (0 <= age && age <= 17) {
                return Dnv.audiencia.AGE_GROUP_1;
            } else if (17 < age && age <= 24) {
                return Dnv.audiencia.AGE_GROUP_2;
            } else if (24 < age && age <= 34) {
                return Dnv.audiencia.AGE_GROUP_3;
            } else if (34 < age && age <= 40) {
                return Dnv.audiencia.AGE_GROUP_4;
            } else if (40 < age && age <= 49) {
                return Dnv.audiencia.AGE_GROUP_5;
            } else if (49 < age && age <= 60) {
                return Dnv.audiencia.AGE_GROUP_6;
            } else if (60 < age && age <= 200) {
                return Dnv.audiencia.AGE_GROUP_7;
            }
        }
    }
}

Dnv.audiencia.report = function(users) {

    var P = 0;  // Total personas presentes
    var H = 0;  // Total hombres presentes
    var M = 0; // Total mujeres presentes
    var FH = 0; // Franja horaria
    var PM = 0;  // Personas que han mirado
    var HM = 0;  // Total hombres que han mirado
    var MM = 0;  // Total mujeres que han mirado
    var TAP = 0; // Tiempo atencion personas
    var TAH = 0;  // Tiempo de atención de hombres
    var TAM = 0;  // Tiempo de atención de mujeres
    var TP = 0; // Tiempo personas (presencia)
    var TH = 0; //Tiempo hombres (presencia)
    var TM = 0; //Tiempo mujeres (presenncia)
    var H10 = 0; //Hombres hasta 10 años
    var M10 = 0; //Mujeres hasta 10 años
    var H20 = 0;
    var M20 = 0;
    var H30 = 0;
    var M30 = 0;
    var H40 = 0;
    var M40 = 0;
    var H50 = 0;
    var M50 = 0;
    var H60 = 0;
    var M60 = 0;
    var H70 = 0;
    var M70 = 0;
    var N = 0;
    var A = 0;
    var S = 0;
    var U = 0;
    var NM = 0;
    var AM = 0;
    var SM = 0;
    var UM = 0;
    var CM = 0;

    users.forEach(function(entry) {
        if (entry.getTrackedface_id() != 0) {
            P += 1;
            var genero = entry.getGender();

            //si no tiene género no hay datos de atención.
            if (genero != 0) {
                switch (genero) {
                    case Dnv.audiencia.GENDER_MALE:
                        H += 1;
                        if (entry.getAttentionTime() > Dnv.audiencia.tiempoImpacto) {
                            HM += 1;
                            TAH += entry.getAttentionTime();
                            PM += 1;
                            TAP += entry.getAttentionTime();
                        }
                        TH += entry.getDwellTime();

                        var edad = entry.getAge();

                        if (0 <= edad && edad <= 10) {
                            H10 += 1;
                        } else if (10 < edad && edad <= 20) {
                            H20 += 1;
                        } else if (20 < edad && edad <= 30) {
                            H30 += 1;
                        } else if (30 < edad && edad <= 40) {
                            H40 += 1;
                        } else if (40 < edad && edad <= 50) {
                            H50 += 1;
                        } else if (50 < edad && edad <= 60) {
                            H60 += 1;
                        } else if (60 < edad && edad <= 200) {
                            H70 += 1;
                        }
                        break;
                    case Dnv.audiencia.GENDER_FEMALE:
                        M += 1;
                        if (entry.getAttentionTime() > Dnv.audiencia.tiempoImpacto) {
                            MM += 1;
                            TAM += entry.getAttentionTime();
                            PM += 1;
                            TAP += entry.getAttentionTime();
                        }
                        TM += entry.getDwellTime();

                        var edad = entry.getAge();

                        if (0 <= edad && edad <= 10) {
                            M10 += 1;
                        } else if (10 < edad && edad <= 20) {
                            M20 += 1;
                        } else if (20 < edad && edad <= 30) {
                            M30 += 1;
                        } else if (30 < edad && edad <= 40) {
                            M40 += 1;
                        } else if (40 < edad && edad <= 50) {
                            M50 += 1;
                        } else if (50 < edad && edad <= 60) {
                            M60 += 1;
                        } else if (60 < edad && edad <= 200) {
                            M70 += 1;
                        }
                        break;
                }
            }
            TP += entry.getDwellTime();
        }
    });

    FH = new Date().getHours();

    CM = Dnv.audiencia.modo;

    return {
        getFH: function() { return FH; },
        getCM: function() { return CM; },
        getP: function() { return P; },
        getH: function() { return H; },
        getM: function() { return M; },
        getPM: function() { return PM; },
        getHM: function() { return HM; },
        getMM: function() { return MM; },
        getTAP: function() { return TAP; },
        getTAH: function() { return TAH; },
        getTAM: function() { return TAM; },
        getTP: function() { return TP; },
        getTM: function() { return TM; },
        getTH: function() { return TH; },
        getH10: function() { return H10 },
        getH20: function() { return H20 },
        getH30: function() { return H30 },
        getH40: function() { return H40 },
        getH50: function() { return H50 },
        getH60: function() { return H60 },
        getH70: function() { return H70 },
        getM10: function() { return M10 },
        getM20: function() { return M20 },
        getM30: function() { return M30 },
        getM40: function() { return M40 },
        getM50: function() { return M50 },
        getM60: function() { return M60 },
        getM70: function() { return M70 },
        getN: function() { return N },
        getA: function() { return A },
        getS: function() { return S },
        getU: function() { return U },
        getNM: function() { return NM },
        getAM: function() { return AM },
        getSM: function() { return SM },
        getUM: function() { return UM }
    }
}

Dnv.audiencia.report_pases = function(apariciones) {

    var P = 0;  // Total personas presentes
    var H = 0;  // Total hombres presentes
    var M = 0; // Total mujeres presentes
    var FH = 0; // Franja horaria
    var PM = 0;  // Personas que han mirado
    var HM = 0;  // Total hombres que han mirado
    var MM = 0;  // Total mujeres que han mirado
    var TAP = 0; // Tiempo atencion personas
    var TAH = 0;  // Tiempo de atención de hombres
    var TAM = 0;  // Tiempo de atención de mujeres
    var TP = 0; // Tiempo personas (presencia)
    var TH = 0; //Tiempo hombres (presencia)
    var TM = 0; //Tiempo mujeres (presenncia)
    var H10 = 0; //Hombres hasta 10 años
    var M10 = 0; //Mujeres hasta 10 años
    var H20 = 0;
    var M20 = 0;
    var H30 = 0;
    var M30 = 0;
    var H40 = 0;
    var M40 = 0;
    var H50 = 0;
    var M50 = 0;
    var H60 = 0;
    var M60 = 0;
    var H70 = 0;
    var M70 = 0;
    var N = 0;
    var A = 0;
    var S = 0;
    var U = 0;
    var NM = 0;
    var AM = 0;
    var SM = 0;
    var UM = 0;
    var AFR = 0;
    var ANG = 0;
    var DIS = 0;
    var HAP = 0;
    var NEU = 0;
    var SAD = 0;
    var SUR = 0;
    var CM = 0;

    var HEM = 0; //edad media de hombres
    var MEM = 0; //edad media de mujeres
    var HMEM = 0; //edad media de hombres mirando
    var MMEM = 0; //edad media de mmujeres miradnp

    var users = [];

    apariciones.forEach(function(entry) {
        if (entry.getTrackedface_id() != 0) {
            P += 1;
            var genero = entry.getGender();

            //si no tiene género no hay datos de atención.
            if (genero != 0) {
                switch (genero) {
                    case Dnv.audiencia.GENDER_MALE:
                        H += 1;

                        var edad = entry.getAge();
                        HEM += edad;

                        if (entry.getAttentionTime() > Dnv.audiencia.tiempoImpacto) {
                            HM += 1;
                            TAH += entry.getAttentionTime();
                            PM += 1;
                            TAP += entry.getAttentionTime();
                            HMEM += edad;
                        }

                        TH += entry.getDwellTime();

                        if (0 <= edad && edad <= 10) {
                            H10 += 1;
                        } else if (10 < edad && edad <= 20) {
                            H20 += 1;
                        } else if (20 < edad && edad <= 30) {
                            H30 += 1;
                        } else if (30 < edad && edad <= 40) {
                            H40 += 1;
                        } else if (40 < edad && edad <= 50) {
                            H50 += 1;
                        } else if (50 < edad && edad <= 60) {
                            H60 += 1;
                        } else if (60 < edad && edad <= 200) {
                            H70 += 1;
                        }
                        break;
                    case Dnv.audiencia.GENDER_FEMALE:
                        M += 1;

                        var edad = entry.getAge();
                        MEM += edad;

                        if (entry.getAttentionTime() > Dnv.audiencia.tiempoImpacto) {
                            MM += 1;
                            TAM += entry.getAttentionTime();
                            PM += 1;
                            TAP += entry.getAttentionTime();
                            MMEM += edad;
                        }

                        TM += entry.getDwellTime();

                        if (0 <= edad && edad <= 10) {
                            M10 += 1;
                        } else if (10 < edad && edad <= 20) {
                            M20 += 1;
                        } else if (20 < edad && edad <= 30) {
                            M30 += 1;
                        } else if (30 < edad && edad <= 40) {
                            M40 += 1;
                        } else if (40 < edad && edad <= 50) {
                            M50 += 1;
                        } else if (50 < edad && edad <= 60) {
                            M60 += 1;
                        } else if (60 < edad && edad <= 200) {
                            M70 += 1;
                        }
                        break;
                }
                AFR += entry.getAFR();
                ANG += entry.getANG();
                DIS += entry.getDIS();
                HAP += entry.getHAP();
                NEU += entry.getNEU();
                SAD += entry.getSAD();
                SUR += entry.getSUR();
            }
            users.push(entry);
            TP += entry.getDwellTime();
        }
    });

    HEM = HEM / H;
    if (isNaN(HEM)) HEM = 0;
    MEM = MEM / M;
    if (isNaN(MEM)) MEM = 0;
    HMEM = HMEM / HM;
    if (isNaN(HMEM)) HMEM = 0;
    MMEM = MMEM / MM;
    if (isNaN(MMEM)) MMEM = 0;

    CM = Dnv.audiencia.modo;

    return {
        getFH: function() { return FH; },
        getCM: function() { return CM; },
        getP: function() { return P; },
        getH: function() { return H; },
        getM: function() { return M; },
        getPM: function() { return PM; },
        getHM: function() { return HM; },
        getMM: function() { return MM; },
        getTAP: function() { return TAP; },
        getTAH: function() { return TAH; },
        getTAM: function() { return TAM; },
        getTP: function() { return TP; },
        getTM: function() { return TM; },
        getTH: function() { return TH; },
        getH10: function() { return H10 },
        getH20: function() { return H20 },
        getH30: function() { return H30 },
        getH40: function() { return H40 },
        getH50: function() { return H50 },
        getH60: function() { return H60 },
        getH70: function() { return H70 },
        getM10: function() { return M10 },
        getM20: function() { return M20 },
        getM30: function() { return M30 },
        getM40: function() { return M40 },
        getM50: function() { return M50 },
        getM60: function() { return M60 },
        getM70: function() { return M70 },
        getN: function() { return N },
        getA: function() { return A },
        getS: function() { return S },
        getU: function() { return U },
        getNM: function() { return NM },
        getAM: function() { return AM },
        getSM: function() { return SM },
        getUM: function() { return UM },
        getAFR: function() { return AFR },
        getANG: function() { return ANG },
        getDIS: function() { return DIS },
        getHAP: function() { return HAP },
        getNEU: function() { return NEU },
        getSAD: function() { return SAD },
        getSUR: function() { return SUR },
        getHEM: function() { return HEM },
        getMEM: function() { return MEM },
        getHMEM: function() { return HMEM },
        getMMEM: function() { return MMEM },
        getUsers: function() { return users }
    }
};

Dnv.audiencia.realTimeStatistics = (function(users) {

    var _maleCount = 0
    var _femaleCount = 0
    var _unknownCount = 0

    var _childCount = 0
    var _youngAdultCount = 0
    var _adultCount = 0
    var _seniorCount = 0
    var _unknownAgeCount = 0

    var _observeCount = 0
    var _totalCount = 0

    var _minDistance = 99999999

    var _childFemaleCount = 0
    var _childMaleCount = 0
    var _youngAdultMaleCount = 0
    var _youngAdultFemaleCount = 0
    var _adultMaleCount = 0
    var _adultFemaleCount = 0
    var _seniorMaleCount = 0
    var _seniorFemaleCount = 0

    var _minDistanceAge = 0
    var _minDistanceGender = 0

    var _predominantEmotion = 0

    function clasifyGender(value) {
        switch (value) {
            case 1:
                _maleCount += 1;
                break;
            case 2:
                _femaleCount += 1;
                break;
            case 3:
                _unknownCount += 1;
                break;
        }
    }

    function clasifyGenderAge(gender, age) {
        if (age < 15) {
            switch (gender) {
                case 1:
                    _childMaleCount += 1;
                    break;
                case 2:
                    _childFemaleCount += 1;
                    break;
            }
            _childCount += 1;
        }

        if (age >= 15 && age < 30) {
            switch (gender) {
                case 1:
                    _youngAdultMaleCount += 1;
                    break;
                case 2:
                    _youngAdultFemaleCount += 1;
                    break
            }
            _youngAdultCount += 1
        }

        if (age >= 30 && age < 60) {
            switch (gender) {
                case 1:
                    _adultMaleCount += 1;
                    break;
                case 2:
                    _adultFemaleCount += 1;
                    break;
            }
            _adultCount += 1
        }

        if (age > 60) {
            switch (gender) {
                case 1:
                    _seniorMaleCount += 1;
                    break;
                case 2:
                    _seniorFemaleCount += 1;
                    break;
            }
            _seniorCount += 1
        }
    }

    function calcularPorcentaje(parte, total) {
        var porcentaje = 0;
        try {
            if (total > 0) {
                porcentaje = (parte / total) * 100;
            } else {
                porcentaje = 0;
            }
        } catch (e) {
            console.error("[AUDIENCIA] (calcularPorcentaje) Error: " + e);
        }
        return porcentaje;
    }

    function resetValues() {
        _maleCount = 0
        _femaleCount = 0
        _unknownCount = 0

        _childCount = 0
        _youngAdultCount = 0
        _adultCount = 0
        _seniorCount = 0
        _unknownAgeCount = 0

        _observeCount = 0
        _totalCount = 0

        _minDistance = 99999999

        _childFemaleCount = 0
        _childMaleCount = 0
        _youngAdultMaleCount = 0
        _youngAdultFemaleCount = 0
        _adultMaleCount = 0
        _adultFemaleCount = 0
        _seniorMaleCount = 0
        _seniorFemaleCount = 0

        _minDistanceAge = 0
        _minDistanceGender = 0

        _predominantEmotion = 0

    }

    return {

        getMaleCount: function() {
            return _maleCount
        },

        getFemaleCount: function() {
            return _femaleCount
        },

        getTotalCount: function() {
            return _totalCount
        },

        getPercentMale: function() {
            return calcularPorcentaje(this.getMaleCount(), this.getTotalCount())
        },

        getPercentFemale: function() {
            return calcularPorcentaje(this.getFemaleCount(), this.getTotalCount())
        },

        getMinDistance: function() {
            return _minDistance
        },

        getRatioMaleFemale: function() {
            var ratio = 0;
            var maleCount = this.getMaleCount();
            var femaleCount = this.getFemaleCount();

            if (maleCount == femaleCount) {
                ratio = 1;
            } else if (maleCount > femaleCount) {
                ratio = 2;
            }
            return ratio;
        },

        getMinDistanceGender: function() {
            return _minDistanceGender;
        },

        getMinDistanceAge: function() {
            return _minDistanceAge;
        },

        getYoungAdultCount: function() {
            return _youngAdultCount
        },

        getPredominantEmotion: function() {
            return _predominantEmotion
        },

        getIsPredominantAudienceGeneral: function(range) {
            switch (range) {
                case Dnv.audiencia.AGE_CHILD:
                    return _childCount > (_youngAdultCount + _adultCount + _seniorCount)
                    break;
                case Dnv.audiencia.AGE_YOUNG:
                    return _youngAdultCount > (_childCount + _adultCount + _seniorCount)
                    break;
                case Dnv.audiencia.AGE_ADULT:
                    return _adultCount > (_childCount + _youngAdultCount + _seniorCount)
                    break;
                case Dnv.audiencia.AGE_SENIOR:
                    return _seniorCount > (_childCount + _youngAdultCount + _adultCount)
                    break;
            }
        },

        getIsPredominantAudience: function(range, gender) {
            if (gender == Dnv.audiencia.GENDER_MALE) {
                switch (range) {
                    case Dnv.audiencia.AGE_CHILD:
                        return _childMaleCount > (_youngAdultCount + _adultCount + _seniorCount) &&
                            _childMaleCount > _childFemaleCount
                        break;
                    case Dnv.audiencia.AGE_YOUNG:
                        return _youngAdultMaleCount > (_childCount + _adultCount + _seniorCount) &&
                            _youngAdultMaleCount > _youngAdultFemaleCount
                        break;
                    case Dnv.audiencia.AGE_ADULT:
                        return _adultMaleCount > (_childCount + _youngAdultCount + _seniorCount) &&
                            _adultMaleCount > _adultFemaleCount
                        break;
                    case Dnv.audiencia.AGE_SENIOR:
                        return _seniorMaleCount > (_childCount + _youngAdultCount + _adultCount) &&
                            _seniorMaleCount > _seniorFemaleCount
                        break;
                }
            } else if (gender == Dnv.audiencia.GENDER_FEMALE) {
                switch (range) {
                    case Dnv.audiencia.AGE_CHILD:
                        return _childFemaleCount > (_youngAdultCount + _adultCount + _seniorCount) &&
                            _childFemaleCount > _childMaleCount
                        break;
                    case Dnv.audiencia.AGE_YOUNG:
                        return _youngAdultFemaleCount > (_childCount + _adultCount + _seniorCount) &&
                            _youngAdultFemaleCount > _youngAdultMaleCount
                        break;
                    case Dnv.audiencia.AGE_ADULT:
                        return _adultFemaleCount > (_childCount + _youngAdultCount + _seniorCount) &&
                            _adultFemaleCount > _adultMaleCount
                        break;
                    case Dnv.audiencia.AGE_SENIOR:
                        return _seniorFemaleCount > (_childCount + _youngAdultCount + _adultCount) &&
                            _seniorFemaleCount > _seniorMaleCount
                        break;
                }
            }
        },

        getChildMaleCount: function() {
            return _childMaleCount
        },

        getChildFemaleCount: function() {
            return _childFemaleCount
        },

        getYoungAdultMaleCount: function() {
            return _youngAdultMaleCount
        },

        getYoungAdultFemaleCount: function() {
            return _youngAdultFemaleCount
        },

        getAdultMaleCount: function() {
            return _adultMaleCount
        },

        getAdultFemaleCount: function() {
            return _adultFemaleCount
        },

        getSeniorMaleCount: function() {
            return _seniorMaleCount
        },

        getSeniorFemaleCount: function() {
            return _seniorFemaleCount
        },

        resetValues: function() {
            resetValues();
        },

        getLiveAudience: function(users) {

            resetValues();

            var minDistanceWatcher = null;

            users.forEach(function(entry) {

                clasifyGender(entry.getGender());
                clasifyGenderAge(entry.getGender(), entry.getAge());

                if ((_minDistance == -1 || entry.getDistance() < _minDistance) && (entry.getDistance() >= 100 && entry.getDistance() <= 1500)) {
                    if (_minDistance != 0) {
                        _minDistance = entry.getDistance();
                        minDistanceWatcher = entry;
                    }
                }

                _totalCount += 1;

            });

            if (minDistanceWatcher) {
                _minDistanceAge = minDistanceWatcher.getAge();
                _minDistanceGender = minDistanceWatcher.getGender();
                _predominantEmotion = minDistanceWatcher.getPredominantEmotion();
            }

            return
        }

    }

})();

Dnv.audiencia.updateCurrentAudience = function(callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.getCurrentUsers(function(users) {
                if (users) {
                    Dnv.audiencia.realTimeStatistics.getLiveAudience(users);
                    callback(true);
                } else {
                    Dnv.audiencia.realTimeStatistics.resetValues();
                    callback(null);
                }
            });
            break;
    }
}

Dnv.audiencia.generateReport = function(start, end, callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.getPeriodUsers(start, end, function(users) {
                if (users) {
                    callback(new Dnv.audiencia.report(users));
                } else {
                    callback(null);
                }
            });
            break;
    }
}

Dnv.audiencia.generateReport_pases = function(start, end, callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.getAparicionesUnicas(start, end, function(apariciones) {
                if (apariciones) {
                    callback(new Dnv.audiencia.report_pases(apariciones));
                } else {
                    callback(new Dnv.audiencia.report_pases([]));
                }
            });
            break;
    }
}

Dnv.audiencia.setCampaign = function(id, callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.setCurrentCampaign(id, function(cB) {
                if (cB) {
                    if (callback) callback(true);
                } else {
                    if (callback) callback(null);
                }
            });
            break;
    }
}

Dnv.audiencia.resetCampaign = function(callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.resetCurrentCampaign(function(cB) {
                if (cB) {
                    if (callback) callback(true);
                } else {
                    if (callback) callback(null);
                }
            });
            break;
    }
}

Dnv.audiencia.getApariciones = function(start, end, callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.getApariciones(start, end, function(apariciones) {
                if (apariciones) {
                    callback(apariciones);
                } else {
                    callback(null);
                }
            });
            break;
    }
}

// solo una aparicion por persona, que es la acumulada de ese periodo
Dnv.audiencia.getAparicionesUnicas = function(start, end, callback) {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            Dnv.audiencia.Releyeble.getAparicionesUnicas(start, end, function(apariciones) {
                if (apariciones) {
                    callback(apariciones);
                } else {
                    callback(null);
                }
            });
            break;
    }
}

Dnv.audiencia.cumpleObjetivoDemografico = function(insercion, aparicion) {
    //min = Math.ceil(0);
    //max = Math.floor(1);
    //return Math.floor(Math.random() * (max - min + 1)) + min;

    if (Dnv.Variables.cumpleCondicionesDemograficas(insercion, aparicion)) {
        return 1;
    } else {
        return 0;
    }
}

Dnv.audiencia.getCosteAparicion = function(insercion, aparicion) {
    //return Math.random() * (0.06 - 0.01) + 0.01;

    var coste = 0;
    if (Dnv.Variables.cumpleCondicionesDemograficas(insercion, aparicion)) {
        coste += parseFloat(insercion.getCostePorOjo().toString().replace(",", "."));
    }
    coste *= parseFloat(Dnv.Pl.lastPlaylist.getPlayer().getFactorDeZona().toString().replace(",", "."));
    return coste
}

Dnv.audiencia.getCostePase = function(slide) {
    //return Math.random() * (0.06 - 0.01) + 0.01;

    var coste = 0;
    coste += parseFloat(slide.getCostePorPase().toString().replace(",", "."));
    return coste
}

Dnv.audiencia.getVideo = function() {
    switch (Dnv.audiencia.modo) {
        case Dnv.audiencia.MODO_RELEYEBLE:
            return Dnv.audiencia.Releyeble.getVideo();
            break;
        default:
            return "";
            break;
    }
}

Dnv.audiencia.Releyeble = (function() {

    var ACT_LICENSE = "get_license_status";
    var ACT_STATUS = "time";
    var ACT_CURRENT_AUDIENCE = "users";
    var ACT_GENERATE_REPORT = "traces";
    var ACT_SET_CAMPAIGN = "set_current_campaign";
    var ACT_RESET_CAMPAIGN = "reset_current_campaign";
    var ACT_VIDEO = "rawvideo";
    var ACT_INFO = "info";

    var version_releyeble = 0;
    var dias_restantes_licencia = 0;

    var intentos_info = 0;

    // funcion para hacer las llamadas a la API REST de Releyable
    // indicandole a que metodo queremos llamar
    function getData(action, params, callback) {
        try {
            function handler() {
                if (this.readyState == 4 && this.readyState === this.DONE) {
                    if (this.status === 200) {
                        try {
                            var respuesta = JSON.parse(this.responseText);
                            if (callback) callback(null, respuesta);
                        } catch (e) {
                            console.error("[RELEYEBLE](getData) Error al parsear el JSON : " + e);
                            if (callback) callback("Error parseando el JSON", null);
                        }
                        
                    } else {
                        //errHandler(this.status);
                    }
                }
            }

            var errCalled = 0;

            function errHandler(e) {
                if (new Date().getTime() - errCalled > 1000) {
                    errCalled = new Date().getTime();
                    console.error("[RELEYEBLE] Error en la petición de " + action + " : " + e);
                    //if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[RELEYEBLE] Error en la petición de " + action + " : " + e, "ERROR");
                    if (callback) callback(true);
                }
            }

            function errHandlerTimeout(e) {
                if (new Date().getTime() - errCalled > 1000) {
                    errCalled = new Date().getTime();
                    console.error("[RELEYEBLE] Timeout en la petición de " + action + " : " + e);
                    //if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[RELEYEBLE] Timeout en la petición de " + action + " : " + e, "ERROR");
                    if (callback) callback(true);
                }
            }

            var paramsURL = "";
            if (params) {
                paramsURL = "?";
                for (var key in params) {
                    paramsURL += key + "=" + params[key] + "&";
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = Dnv.cfg.getCfgInt("ReleyebleTimeout", 10000);
            client.ontimeout = errHandlerTimeout;
            client.open("GET", "http://" + Dnv.audiencia.ip + ":" + Dnv.audiencia.puerto + "/v1/" + action + paramsURL);
            // comentar este log que es excesivo
            console.info("[RELEYEBLE] (getData) " + "http://" + Dnv.audiencia.ip + ":" + Dnv.audiencia.puerto + "/v1/" + action + paramsURL);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            client.send();
        } catch (e) {
            console.error("[RELEYEBLE] (getData) Error en la petición de " + action + " : " + e);
            if (callback) callback(true);
        }
    }

    // parsea los datos a tiempo real
    // y nos devuelve el listado de usuarios que hay
    function parseCurrentFaces(data, report) {
        try {
            var users = [];
            var usersJSON;

            usersJSON = data.users;

            // si son datos de un periodo de tiempo, no live,
            // la forma en que viene el JSON es distinta
            if (report) {
                usersJSON = data.events;
            }

            if (usersJSON) {
                usersJSON.forEach(function(entry) {
                    if (report) entry = entry.personInfo;
                    var gender = 0;
                    switch (entry.gender) {
                        case "MALE":
                            gender = 1
                            break;
                        case "FEMALE":
                            gender = 2
                            break;
                    }
                    var lastEmotionAFR = null;
                    if (entry.lastEmotion) lastEmotionAFR = entry.lastEmotion.AFR;
                    var lastEmotionANG = null;
                    if (entry.lastEmotion) lastEmotionANG = entry.lastEmotion.ANG;
                    var lastEmotionDIS = null;
                    if (entry.lastEmotion) lastEmotionDIS = entry.lastEmotion.DIS;
                    var lastEmotionHAP = null;
                    if (entry.lastEmotion) lastEmotionHAP = entry.lastEmotion.HAP;
                    var lastEmotionNEU = null;
                    if (entry.lastEmotion) lastEmotionNEU = entry.lastEmotion.NEU;
                    var lastEmotionSAD = null;
                    if (entry.lastEmotion) lastEmotionSAD = entry.lastEmotion.SAD;
                    var lastEmotionSUR = null;
                    if (entry.lastEmotion) lastEmotionSUR = entry.lastEmotion.SUR;
                    users.push(new Dnv.audiencia.user(entry.faceId,
                        gender,
                        entry.distance,
                        entry.age,
                        entry.ageGroup,
                        entry.ageRange,
                        entry.attentionTime,
                        entry.dwellTime,
                        entry.smilingTime,
                        entry.emotionalEngagementKPI,
                        entry.sentimentKPI,
                        entry.appearances,
                        entry.glasses,
                        entry.beard,
                        lastEmotionAFR,
                        lastEmotionANG,
                        lastEmotionDIS,
                        lastEmotionHAP,
                        lastEmotionNEU,
                        lastEmotionSAD,
                        lastEmotionSUR));
                });
            }
            return users
        } catch (e) {
            console.error("[RELEYEBLE] (parseCurrentFaces) Error al parsear: " + data + " : " + e);
            return
        }
    }

    // nos devuelve cada aparición de una persona durante un periodo de tiempo
    function parseApariciones(data, report) {
        try {
            var apariciones = [];
            var usersJSON;

            usersJSON = data.users;

            // si son datos de un periodo de tiempo, no live,
            // la forma en que viene el JSON es distinta
            if (report) {
                usersJSON = data.events;
            }

            if (usersJSON) {
                usersJSON.forEach(function(entry) {
                    if (report) entry = entry.personInfo;

                    var faceId = entry.faceId;
                    var age = entry.age;
                    var emotions = entry.dominantEmotion;
                    var gender = 0;
                    switch (entry.gender) {
                        case "MALE":
                            gender = 1
                            break;
                        case "FEMALE":
                            gender = 2
                            break;
                    }
                    // tiempo mirando
                    entry.dwell.forEach(function(entryMirando) {
                        var startPeriodPresence = entryMirando.s;
                        var endPeriodPresence = entryMirando.e;

                        var timePeriodAttentionTotal = 0;
                        var timePeriodPresenceTotal = endPeriodPresence - startPeriodPresence;

                        // tiempo atendiendo
                        entry.attention.forEach(function(entryAtencion) {
                            var startIntervalAttention = entryAtencion.s;
                            var endIntervalAttention = entryAtencion.e;
                            var timePeriodAttention = endIntervalAttention - startIntervalAttention;

                            timePeriodAttentionTotal += isInPeriod(startIntervalAttention, endIntervalAttention, startPeriodPresence, endPeriodPresence);
                        });

                        timePeriodPresenceTotal = Math.round(timePeriodPresenceTotal / 1000);
                        timePeriodAttentionTotal = Math.round(timePeriodAttentionTotal / 1000);

                        if (timePeriodPresenceTotal != 0) {
                            apariciones.push(new Dnv.audiencia.aparicion(
                                startPeriodPresence,
                                faceId,
                                gender,
                                age,
                                timePeriodPresenceTotal,
                                timePeriodAttentionTotal,
                                emotions.AFR,
                                emotions.ANG,
                                emotions.DIS,
                                emotions.HAP,
                                emotions.NEU,
                                emotions.SAD,
                                emotions.SUR
                            ));
                        }
                    });

                });
            }
            return apariciones
        } catch (e) {
            console.error("[RELEYEBLE] (parseApariciones) Error al parsear: " + data + " : " + e);
            return
        }
    }

    // devuelve el tiempo de concurrencia de un intervalo de tiempo dentro de un periodo de tiempo
    // todos los atributos son timestamps
    function isInPeriod(startInterval, endInterval, startPeriod, endPeriod) {

        var startConcurrency;
        var endConcurrency;

        if (endInterval < startPeriod || // si el intervalo finaliza antes del inicio del periodo o
            startInterval > endPeriod) { // si el intervalo comienza despues del periodo
            return 0;					 // no hay concurrencia
        }

        // si el intervalo se inicia antes del periodo, marcamos como inicio de concurrencia
        // el momento del inicio del periodo
        if (startInterval < startPeriod) {
            startConcurrency = startPeriod;
        } else {
            startConcurrency = startInterval;
        }

        // si el intervalo finaliza despues del periodo, marcamos como final de concurrencia
        // el momento del final del periodo
        if (endInterval > endPeriod) {
            endConcurrency = endPeriod;
        } else {
            endConcurrency = endInterval;
        }

        return endConcurrency - startConcurrency

    }

    function parseAparicionesUnicas(data, report, start, end) {
        try {
            var apariciones = [];
            var usersJSON;

            usersJSON = data.users;

            // si son datos de un periodo de tiempo, no live,
            // la forma en que viene el JSON es distinta
            if (report) {
                usersJSON = data.events;
            }

            if (usersJSON) {
                usersJSON.forEach(function(entry) {

                    if (report) entry = entry.personInfo;

                    var faceId = entry.faceId;
                    var age = entry.age;
                    var gender = 0;

                    var emotions;
                    if (report) {
                        emotions = entry.dominantEmotion;
                    } else {
                        emotions = entry.lastEmotion;
                    }
                    if (!emotions.AFR) {
                        emotions.AFR = 0;
                        emotions.ANG = 0;
                        emotions.DIS = 0;
                        emotions.HAP = 0;
                        emotions.NEU = 0;
                        emotions.SAD = 0;
                        emotions.SUR = 0;
                    }

                    switch (entry.gender) {
                        case "MALE":
                            gender = 1
                            break;
                        case "FEMALE":
                            gender = 2
                            break;
                    }

                    var timePeriodPresenceTotal = 0;
                    var timePeriodAttentionTotal = 0;

                    var startPeriodPresence;
                    var endPeriodPresence;

                    entry.dwell.forEach(function(entryMirando) {
                        startPeriodPresence = entryMirando.s;
                        endPeriodPresence = entryMirando.e;

                        var timePresence = isInPeriod(startPeriodPresence, endPeriodPresence, start, end);

                        if (timePresence != 0) {
                            timePeriodPresenceTotal += timePresence;
                            entry.attention.forEach(function(entryAtencion) {
                                var startIntervalAttention = entryAtencion.s;
                                var endIntervalAttention = entryAtencion.e;
                                timePeriodAttentionTotal += isInPeriod(startIntervalAttention, endIntervalAttention, start, end);
                            });
                        }
                    });

                    timePeriodPresenceTotal = Math.round(timePeriodPresenceTotal / 1000);
                    timePeriodAttentionTotal = Math.round(timePeriodAttentionTotal / 1000);

                    if (timePeriodPresenceTotal != 0) {
                        apariciones.push(new Dnv.audiencia.aparicion(
                            startPeriodPresence,
                            faceId,
                            gender,
                            age,
                            timePeriodPresenceTotal,
                            timePeriodAttentionTotal,
                            emotions.AFR,
                            emotions.ANG,
                            emotions.DIS,
                            emotions.HAP,
                            emotions.NEU,
                            emotions.SAD,
                            emotions.SUR
                        ));
                    }

                });
            }
            return apariciones
        } catch (e) {
            console.error("[RELEYEBLE] (parseAparicionesUnicas) Error al parsear: " + data + " : " + e);
            return
        }
    }

    return {

        checkLicense: function(callback) {
            getData(ACT_LICENSE, null, function(error, data) {
                if (error) {
                    console.warn("[RELEYEBLE] Problema al comprobar licencia: " + error);
                    Dnv.monitor.writeLogFile("[Releyeble](checkLicense) " + error, "ERROR");
                    if (callback) callback(false);
                } else {
                    Dnv.monitor.writeLogFile("[Releyeble](checkLicense) " + data.response, "INFO");
                    if (data.response.toLowerCase() == "licence is ok.") {
                        Dnv.monitor.writeLogFile("[Releyeble](checkLicense) OK", "INFO");
                        if (callback) callback({ estado: "OK", mensaje: data.response});
                    } else if (data.response.toLowerCase() == "your licence is in the renewal period that last a week." || data.response.toLowerCase() == "your licence is in the grace period that last a week.") {
                        Dnv.monitor.writeLogFile("[Releyeble](checkLicense) WARNING", "INFO");
                        if (callback) callback({ estado: "WARNING", mensaje: data.response });
                    } else {
                        Dnv.monitor.writeLogFile("[Releyeble](checkLicense) ERROR", "INFO");
                        console.warn("[RELEYEBLE] No hay licencia valida: " + data.response);
                        if (callback) callback({ estado: "ERROR", mensaje: data.response });
                    }
                }
            });
        },

        checkStatus: function(callback) {
            getData(ACT_STATUS, null, function(error, data) {
                if (error) {
                    console.warn("[RELEYEBLE] Problema al check estado: " + error);
                    Dnv.monitor.writeLogFile("[Releyeble](checkStatus) " + error, "ERROR");
                    if (callback) callback(false);
                } else {
                    Dnv.monitor.writeLogFile("[Releyeble](checkStatus) " + data.response, "INFO");
                    if (data.time.toLowerCase() != "") {
                        if (callback) callback(true);
                    } else {
                        console.warn("[RELEYEBLE] Algo no funciona bien :( " + data.response);
                        //Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Problemas con la medición de audiencia");
                        if (callback) callback(false);
                    }
                }
            });
        },
        //Funcion para conseguir la version de compilacion y los dias restantes de licencia
        getInfo: function (update) {
            if (update === undefined) update = false;

            var id_medicion = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPlayerName() + " Audiencia";
            var versionSoftware, diasRestantes;
            try {
                getData(ACT_INFO, null, function (error, data) {
                    if (error) { //Si la version de releyeble es vieja el json que devuelve puede tener errores, si se da este caso solo mandamos un mensaje, porque puede que en las siguientes peticiones de una respuesta buena
                        console.warn("[RELEYEBLE] Problema al leer info: " + error);
                        Dnv.monitor.writeLogFile("[Releyeble](checkStatus.info) " + error, "ERROR");
                        versionSoftware = "error";
                        //Dnv.servidor.setMetadatoDispositivoExterno(id_medicion, "ReleyebleVersion", "Problema al consultar version (JSON)");
                        if (intentos_info < 3) { //Para que solo reintente 3 veces la peticion  y no sature el log
                            intentos_info++;
                            setTimeout(Dnv.audiencia.Releyeble.getInfo(), 60000);
                        }else if (intentos_info == 4){
                            setTimeout(intentos_info = 0, 30 * 60 * 1000);
                        }
                        

                    } else {
                        intentos_info = 0;
                        Dnv.monitor.writeLogFile("[Releyeble](checkStatus.info) " + JSON.stringify(data), "INFO");
                        versionSoftware = data.report.info.status.softwareVersion;
                        diasRestantes = data.report.info.systemStatus.license.daysLeft;
                        Dnv.monitor.writeLogFile("[Releyeble](checkStatus.info) Version de Releyeble" + versionSoftware, "INFO");
                        console.log("[Releyeble](checkStatus.info) Version de Releyeble" + versionSoftware);
                        Dnv.monitor.writeLogFile("[Releyeble](checkStatus.info) Dias restantes de licencia Releyeble" + diasRestantes, "INFO");
                        console.log("[Releyeble](checkStatus.info) Dias restantes de licencia Releyeble" + diasRestantes);

                        if (versionSoftware !== version_releyeble) {
                            version_releyeble = versionSoftware;
                            Dnv.servidor.setMetadatoDispositivoExterno(id_medicion, "ReleyebleVersion", version_releyeble);
                        }
                        if (diasRestantes !== dias_restantes_licencia && diasRestantes != 36500) { //Por algun motivo nos llega este valor algunas veces.
                            dias_restantes_licencia = diasRestantes;
                            Dnv.servidor.setMetadatoDispositivoExterno(id_medicion, "ReleyebleDiasRestantes", dias_restantes_licencia);
                            
                        }

                    }

                    if (update) {
                        if (versionSoftware != "error") {
                            Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.OK, "[UPDATE][RELEYEBLE] Version actual instalada: " + versionSoftware);
                        } else {
                            Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.OK, "[UPDATE][RELEYEBLE] No se puede obtener el codigo de la version actual instalada");
                        }
                        
                    }
                });
                
            } catch (e) {
                console.log("[Releyeble](checkStatus.info) Error en consulta de version");
            }


        },
        getCurrentUsers: function(callback) {
            getData(ACT_CURRENT_AUDIENCE, null, function(error, data) {
                if (error) {
                    callback(null);
                } else {
                    callback(parseCurrentFaces(data));
                }
            });
        },

        getPeriodUsers: function(start, end, callback) {
            getData(ACT_GENERATE_REPORT, { begin: start.getTime(), end: end.getTime() }, function(error, data) {
                if (error) {
                    callback(null);
                } else {
                    callback(parseCurrentFaces(data, true));
                }
            });
        },

        setCurrentCampaign: function(id, callback) {
            getData(ACT_SET_CAMPAIGN, { campaign: id }, function(error) {
                if (error) {
                    callback(null);
                } else {
                    callback(true);
                }
            });
        },

        resetCurrentCampaign: function(callback) {
            getData(ACT_RESET_CAMPAIGN, null, function(error) {
                if (error) {
                    callback(null);
                } else {
                    callback(true);
                }
            });
        },

        getApariciones: function(start, end, callback) {
            getData(ACT_GENERATE_REPORT, { begin: start.getTime(), end: end.getTime() }, function(error, data) {
                if (error) {
                    callback(null);
                } else {
                    callback(parseApariciones(data, true));
                }
            });
        },

        getAparicionesUnicas: function(start, end, callback) {
            var apariciones = [];

            getData(ACT_GENERATE_REPORT, { begin: start.getTime(), end: end.getTime() }, function(error, data) {
                if (error) {
                    callback([]);
                } else {
                    apariciones = parseAparicionesUnicas(data, true, start.getTime(), end.getTime());

                    // hay que llamar al metodo de live audience, para añadir a los usuarios que no se han ido
                    // y todavia no estan persistidos en traces
                    getData(ACT_CURRENT_AUDIENCE, null, function(error, data) {
                        if (error) {
                            callback([]);
                        } else {
                            callback(apariciones.concat(parseAparicionesUnicas(data, false, start.getTime(), end.getTime())));
                        }
                    });
                }
            });
        },

        getVideo: function() {
            return "http://" + Dnv.audiencia.ip + ":" + Dnv.audiencia.puerto + "/v1/" + ACT_VIDEO;
        }

    }
})();


Dnv.licenciaReleyeble = function() {

    var player = Dnv.cfg.getCfgInt("MyOwnCode", 0)
    var urlMaster = Dnv.cfg.getCfgString("WebServiceURL", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer() + "/WSResources/RemoteResources.asmx");
    var urlLocalGetLicense = "http://" + Dnv.cfg.getCfgString("ReleyebleIP", "127.0.0.1") + ":" + Dnv.cfg.getCfgInt("ReleyeblePort", 9080) + "/v1/license";
    var urlLocalSetLicense = "http://" + Dnv.cfg.getCfgString("ReleyebleIP", "127.0.0.1") + ":" + Dnv.cfg.getCfgInt("ReleyeblePort", 9080) + "/v1/set_license_file";

    return {

        activarLicencia: function activarLicencia(callback, errorCallback) {
            console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: activarLicencia");

            var errorManejado = false;
            function errRedHandler(e) {
                if (errorManejado) return; // No lo manejamos 2 veces
                errorManejado = true;
                try { // Avisamos solo si no tenemos licencia
                    //Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.ERROR, "No podemos activar licencia Releyeble: " + e);
                } catch (e) { };
                console.error("[AUDIENCIA][LICENCIA RELEYEBLE] Error (licencia releyeble): " + e);
                //console.trace()
                if (errorCallback) errorCallback("Error (licencia releyeble): " + e);
            }


            function errLicenciaHandler(e) {
                if (errorManejado) return; // No lo manejamos 2 veces
                errorManejado = true;

                // Parece que no podemos contactar con el servidor

                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[AUDIENCIA][LICENCIA RELEYEBLE] Error (licencia releyeble): " + e);
                }

                //console.trace();

                try { // Avisamos solo si no tenemos licencia
                    //Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.ERROR, "No podemos activar licencia Releyeble: " + e);
                } catch (e) { };

                if (errorCallback) errorCallback("Error (licencia releyeble): " + e);
            }



            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {

                        console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Respuesta a la peticion local de licencia Releyeble: " + this.response);

                        try {
                            //if (callback) {
                            if (this.response && this.response.indexOf("{") == 0) {

                                var jsonResponse = JSON.parse(this.responseText);
                                var uuid = jsonResponse.license.uuid;
                                var estadoLicencia = jsonResponse.license.licensed;
                                if (estadoLicencia == "true") {
                                    var isLicenciaActivada = true;
                                    console.info("[AUDIENCIA][LICENCIA RELEYEBLE]: Licencia activada: " + uuid);
                                } else {
                                    var isLicenciaActivada = false
                                }

                                console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: recibida licencia Releyeble: " + uuid);



                                console.info("[AUDIENCIA][LICENCIA RELEYEBLE]: Licencia no activada, llamamos a ComprobarLicenciaAudiencia con los parametros: player=" + player + "&uuid=" + uuid + "&activada=" + isLicenciaActivada.toString());

                                var clientLicencia = new XMLHttpRequest();
                                clientLicencia.onreadystatechange = handlerLicencia;
                                clientLicencia.onerror = errRedHandler;
                                clientLicencia.timeout = 45000;
                                clientLicencia.ontimeout = function() {
                                    errRedHandler("Timed out al pedir licencia Releyeble al servidor " + Dnv.cfg.getConfigIpServer() + " !!!");

                                }

                                console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Pidiendo licencia Releyeble a " + Dnv.cfg.getConfigIpServer());
                                console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: PID " + Dnv.cfg.getConfigPID());

                                if (uuid.indexOf("+") != -1) {
                                    uuid = uuid.replace(/\+/g, '%2B');

                                }


                                clientLicencia.open("GET", urlMaster + '/ComprobarLicenciaAudiencia?player="' + player + '"&uuid="' + uuid + '"' + "&activada=" + isLicenciaActivada.toString());

                                clientLicencia.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                                clientLicencia.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');


                                clientLicencia.send();






                                //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));



                            } else {
                                if (this.response) {

                                    //el mensaje es algo así: ;;TEXT;;Error. Ha expirado la vigencia
                                    /*
                                    * En caso de error, el servidor devuelve sin cifrar: 
                                    * ";;TEXT;;Mensaje de error" (Mensaje de error empieza por "Error") En caso de que la empresa no exista, no queden licencias...
                                    * ";;TEXT;;ERROR;;Error al procesar la solicitud de licencia" En caso de excepcion al generar la licencia
                                    * "" Si hubo un error en el servicio WCF
                                    */

                                    if (this.response.indexOf("{") != 0) {
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Hay algún error con la licencia (" + this.response + ")");

                                    } else if (this.response === "") { // Excepcion en el servidor
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Recibida respuesta vacia, error en el servidor.");
                                    }


                                } else {
                                    console.error("[AUDIENCIA][LICENCIA RELEYEBLE]: No se recibió licencia o licencia incorrecta. Respuesta = " + this.response);
                                }
                            }
                            //}
                        } catch (e) {
                            errRedHandler(e.message);
                        }
                    } else {
                        errRedHandler("Error HTTP: " + this.statusText); // Estrictamente no es error de red, pero bueno
                    }
                }
            }

            function handlerLicencia() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {

                        console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Respuesta a la peticion de licencia Releyeble: " + this.response);

                        try {
                            //if (callback) {
                            if (this.response && this.response.indexOf("<") == 0) {

                                var objRespuesta = JSON.parse(this.responseXML.getElementsByTagName("string")[0].childNodes[0].nodeValue);
                                var stringXML = this.responseXML.getElementsByTagName("string")[0].childNodes[0].nodeValue;
                                var statusLicencia = objRespuesta.status;

                                if (statusLicencia == "ok") {
                                    var licencenseValid = true;
                                } else {
                                    var licencenseValid = false
                                }

                                console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Recibido JSON licencia Releyeble: " + this.responseText);


                                if (licencenseValid) {

                                    console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Licencia valida: " + objRespuesta.response.licence + ", Se procede a activarla en local.");

                                    var setLicencia = new XMLHttpRequest();
                                    setLicencia.onreadystatechange = handlerSetLicencia;
                                    setLicencia.onerror = errRedHandler;
                                    setLicencia.timeout = 45000;
                                    setLicencia.ontimeout = function() {
                                        errRedHandler("Timed out al pedir licencia Releyeble!!!");

                                    }
                                    stringXML = JSON.stringify(objRespuesta.response);
                                    if (stringXML.indexOf("+") != -1) {
                                        stringXML = stringXML.replace(/\+/g, '%2B');
                                    }
                                    setLicencia.open("GET", urlLocalSetLicense + "?licence=" + stringXML);

                                    setLicencia.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                                    setLicencia.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

                                    setLicencia.send();

                                } else {
                                    console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: La licencia no es válida");
                                    errLicenciaHandler("[AUDIENCIA][LICENCIA RELEYEBLE]: La licencia no es válida");
                                }
                            } else {
                                if (this.response) {


                                    if (this.response.indexOf("<") != 0) {
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Hay algún error con la licencia (" + this.response + ")");
                                    } else if (this.response === "") { // Excepcion en el servidor
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Recibida respuesta vacia, error en el servidor.");
                                    }

                                    errLicenciaHandler(this.response);
                                } else {
                                    errLicenciaHandler("[AUDIENCIA][LICENCIA RELEYEBLE]: No se ha activado la licencia correctamente o licencia incorrecta. Respuesta = " + this.response);
                                }
                            }
                            //}
                        } catch (e) {
                            errRedHandler(e.message);
                        }
                    } else {
                        errRedHandler("Error HTTP: " + this.statusText); // Estrictamente no es error de red, pero bueno
                        Dnv.systemInfo.setEstadoConectividadLicencia("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            function handlerSetLicencia() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {

                        console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Respuesta a la peticion de activacion local de licencia Releyeble: " + this.response);

                        try {
                            //if (callback) {
                            if (this.response && this.response.indexOf("{") == 0) {

                                console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Licencia Releyeble activada localmente. Respuesta: " + this.responseText);


                            } else {
                                if (this.response) {


                                    if (this.response === "") { // Excepcion en el servidor
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Recibida respuesta vacia, error en el servidor.");
                                    } else {
                                        console.warn("[AUDIENCIA][LICENCIA RELEYEBLE]: Error al activar licencia en el player.");
                                    }

                                    errLicenciaHandler(this.responseText);
                                } else {
                                    errLicenciaHandler("[AUDIENCIA][LICENCIA RELEYEBLE]: No se recibió licencia o licencia incorrecta. Respuesta = " + this.response);
                                }
                            }
                            //}
                        } catch (e) {
                            errRedHandler(e.message);
                        }
                    } else {
                        errRedHandler("Error HTTP: " + this.statusText); // Estrictamente no es error de red, pero bueno

                    }
                }
            }


            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errRedHandler;
            client.timeout = 45000;
            client.ontimeout = function() {
                errRedHandler("Timed out al pedir licencia Releyeble!!!");

            }

            console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: Pidiendo licencia Releyeble");
            console.log("[AUDIENCIA][LICENCIA RELEYEBLE]: PID " + Dnv.cfg.getConfigPID());
            client.open("GET", urlLocalGetLicense);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            client.send();
        }



    };
};

// Activar el modo correspondiente de medición
Dnv.audiencia.start = function() {

    if (Dnv.cfg.getCfgBoolean("MedicionAudienciaHabilitado", false)) {

        Dnv.audiencia.tiempoImpacto = Dnv.cfg.getCfgInt("MedicionAudiencia_TiempoImpacto", 2); // en segundos
        Dnv.audiencia.objidPlayer = Dnv.cfg.getCfgInt("MyOwnCode", 0);

        // Big Data - Wipy
        if (Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", false)) {
            console.info("[AUDIENCIA] BIGDATA ACTIVADA");
            Dnv.monitor.writeLogFile("[AUDIENCIA] Se va a activar la bigData", "INFO");
            Dnv.bigdata.start();
        }

        switch (Dnv.cfg.getCfgInt("TipoMedicionAudiencia", 6)) {
            case Dnv.audiencia.MODO_RELEYEBLE:
                console.info("[AUDIENCIA] Modo RELEYEBLE ACTIVADO");

                Dnv.audiencia.modo = Dnv.audiencia.MODO_RELEYEBLE;

                Dnv.audiencia.ip = Dnv.cfg.getCfgString("ReleyebleIP", "127.0.0.1");
                Dnv.audiencia.puerto = Dnv.cfg.getCfgInt("ReleyeblePort", 9080);

                // comprobar el estado de la medicion
                function check() {
                    var id_medicion = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPlayerName() + " Audiencia";
                    Dnv.audiencia.Releyeble.checkStatus(function (status) {
                        Dnv.monitor.writeLogFile("[Releyeble](estatus) " + status, "INFO");
                        if (status) {
                            Dnv.audiencia.Releyeble.checkLicense(function (status) {
                                Dnv.monitor.writeLogFile("[Releyeble](start.check) Estado: " + status.estado + ", Mensaje: " + status.mensaje, "INFO");
                                if (status.estado == "OK") {
                                    Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.OK, status.mensaje);
                                    Dnv.monitor.writeLogFile("[Releyeble](start.check) " + status.mensaje, "INFO");
                                } else if (status.estado == "WARNING") {
                                    Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.WARNING, status.mensaje);
                                    Dnv.monitor.writeLogFile("[Releyeble](start.check) " + status.mensaje, "INFO");
                                } else if (status.estado == "ERROR") {
                                    Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.ERROR, status.mensaje);
                                    Dnv.monitor.writeLogFile("[Releyeble](start.check) " + status.mensaje, "INFO");
                                } else {
                                    Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.ERROR, "Sin licencia");
                                    Dnv.monitor.writeLogFile("[Releyeble](start.check) " + status.mensaje, "INFO");
                                }
                            });
                        } else {
                            Dnv.alarmas.dispositivosExternos.onEstado(id_medicion, Dnv.alarmas.estados.ERROR, "Perdida de conectividad");
                            Dnv.monitor.writeLogFile("[Releyeble](start.check) Perdida de conectividad", "INFO");
                        }
                    });
                }

                setTimeout(function() {
                    Dnv.licenciaReleyeble().activarLicencia();
                    setTimeout(function() {
                        check();
                        setInterval(check, 60000);
                        Dnv.audiencia.Releyeble.getInfo();
                        setInterval(function() { Dnv.licenciaReleyeble().activarLicencia() }, 8 * 3600 * 1000);
                    }, 60000);
                }, 120000);



                break;
            default:
                console.error("[AUDIENCIA] Modo " + Dnv.cfg.getCfgInt("TipoMedicionAudiencia", 6) + " no disponible");
                break;
        }
    }
}