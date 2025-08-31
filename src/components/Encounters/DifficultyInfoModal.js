// src/components/Encounters/DifficultyInfoModal.js

import React from 'react';
import './DifficultyInfoModal.css';

function DifficultyInfoModal({ onClose }) {
    const handleOverlayClick = (e) => {
        // Close modal only if the click is directly on the overlay
        if (e.target.classList.contains('difficulty-info-modal-overlay')) {
            onClose();
        }
    };

    return (
        <div className="difficulty-info-modal-overlay" onClick={handleOverlayClick}>
            <div className="difficulty-info-modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>DIFICULTAD DE UN ENCUENTRO DE COMBATE</h2>

                <p>Los encuentros de combate pueden clasificarse en cuatro categorías en función de su dificultad:</p>
                <ul>
                    <li><strong>Fácil:</strong> Un encuentro fácil no consumirá los recursos de los personajes ni les pondrá realmente en peligro. Puede que pierdan unos cuantos puntos de golpe, pero su victoria estará, casi con total seguridad, garantizada.</li>
                    <li><strong>Dificultad media:</strong> Un encuentro de dificultad media puede dar un susto o dos a los personajes, pero estos deberían salir victoriosos sin sufrir baja alguna. Es probable que uno o más aventureros tengan que consumir recursos para curarse.</li>
                    <li><strong>Difícil:</strong> Un encuentro difícil puede acabar mal para los aventureros. Los personajes más débiles podrían quedar fuera de combate y existe una pequeña posibilidad de que alguno, o incluso varios, mueran.</li>
                    <li><strong>Mortal:</strong> Un encuentro mortal podría resultar letal para uno o más personajes. Los aventureros tendrán que elaborar una buena estrategia y reaccionar con rapidez si quieren sobrevivir. Existe un riesgo muy grande de que el grupo salga derrotado.</li>
                </ul>

                <h3>UMBRALES DE PX POR NIVEL DEL PERSONAJE</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nivel del personaje</th>
                            <th>Fácil</th>
                            <th>Media</th>
                            <th>Difícil</th>
                            <th>Mortal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
                        <tr><td>1</td><td>25</td><td>50</td><td>75</td><td>100</td></tr>
                        <tr><td>2</td><td>50</td><td>100</td><td>150</td><td>200</td></tr>
                        <tr><td>3</td><td>75</td><td>150</td><td>225</td><td>400</td></tr>
                        <tr><td>4</td><td>125</td><td>250</td><td>375</td><td>500</td></tr>
                        <tr><td>5</td><td>250</td><td>500</td><td>750</td><td>1100</td></tr>
                        <tr><td>6</td><td>300</td><td>600</td><td>900</td><td>1400</td></tr>
                        <tr><td>7</td><td>350</td><td>750</td><td>1100</td><td>1700</td></tr>
                        <tr><td>8</td><td>450</td><td>900</td><td>1400</td><td>2100</td></tr>
                        <tr><td>9</td><td>550</td><td>1100</td><td>1600</td><td>2400</td></tr>
                        <tr><td>10</td><td>600</td><td>1200</td><td>1900</td><td>2800</td></tr>
                        <tr><td>11</td><td>800</td><td>1600</td><td>2400</td><td>3600</td></tr>
                        <tr><td>12</td><td>1000</td><td>2000</td><td>3000</td><td>4500</td></tr>
                        <tr><td>13</td><td>1100</td><td>2200</td><td>3400</td><td>5100</td></tr>
                        <tr><td>14</td><td>1250</td><td>2500</td><td>3800</td><td>5700</td></tr>
                        <tr><td>15</td><td>1400</td><td>2800</td><td>4300</td><td>6400</td></tr>
                        <tr><td>16</td><td>1600</td><td>3200</td><td>4800</td><td>7200</td></tr>
                        <tr><td>17</td><td>2000</td><td>3900</td><td>5900</td><td>8800</td></tr>
                        <tr><td>18</td><td>2100</td><td>4200</td><td>6300</td><td>9500</td></tr>
                        <tr><td>19</td><td>2400</td><td>4900</td><td>7300</td><td>10900</td></tr>
                        <tr><td>20</td><td>2800</td><td>5700</td><td>8500</td><td>12700</td></tr>
                    </tbody>
                </table>

                <h3>EVALUAR LA DIFICULTAD DE UN ENCUENTRO</h3>
                <p>Utiliza este método para estimar la dificultad de cualquier encuentro de combate.</p>
                <ol>
                    <li><strong>Determina los umbrales de PX.</strong> En primer lugar, averigua los umbrales de puntos de experiencia (PX) de cada uno de los personajes del grupo. La tabla "umbrales de PX por nivel del personaje" muestra cuatro umbrales de PX para cada nivel, uno por cada categoría de dificultad de encuentros. Utilízala para, a partir del nivel del personaje, determinar sus umbrales y repite este proceso para todos los miembros del grupo.</li>
                    <li><strong>Determina los umbrales de PX del grupo.</strong> Suma, para cada una de las categorías de dificultad, los umbrales de PX de todos los personajes. Estos totales serán los umbrales de PX del grupo. Habrá cuatro en total, uno para categoría de dificultad de encuentro posible.
                        <p>Así, si tu grupo está formado por tres personajes de nivel 3 y uno de nivel 2, calcularás los umbrales de PX del grupo de la siguiente forma:</p>
                        <ul>
                            <li>Fácil: 275 PX (75 + 75 + 75 + 50)</li>
                            <li>Dificultad media: 550 PX (150 + 150 + 150 + 100)</li>
                            <li>Difícil: 825 PX (225 + 225 + 225 + 150)</li>
                            <li>Mortal: 1.400 PX (400 + 400 + 400 + 200)</li>
                        </ul>
                        <p>Toma nota de estos totales, porque los usarás para todos los encuentros de la aventura.</p>
                    </li>
                    <li><strong>Determina el total de PX de los monstruos.</strong> Suma los PX de todos los monstruos que forman parte del encuentro. La cantidad que proporciona cada uno se muestra en su perfil.</li>
                    <li><strong>Modifica el total de PX teniendo en cuenta el número de monstruos.</strong> Si el encuentro está compuesto por más de un monstruo, deberás multiplicar el total de PX por un número. Cuantos más monstruos haya, más tiradas de ataque contra los personajes harás en cada asalto, aumentando la dificultad del encuentro. Para poder estimar con más precisión la dificultad de un encuentro, multiplica su total de PX (ya sumados los de todos los monstruos) por el valor que aparece en la tabla "multiplicadores de encuentros".
                        <p>De este modo, si tu encuentro está formado por cuatro monstruos y, sumando sus PX, tienes un total de PX de 500, deberás multiplicar este número por dos, acabando con un total ajustado de 1.000 PX. Este valor ajustado no quiere decir que derrotar a los monstruos proporcione esa cantidad de PX; su único fin es ayudarte a calibrar mejor la dificultad del encuentro.</p>
                        <p>Cuando hagas este cálculo, no tengas en cuenta para el número de monstruos a aquellos cuyo valor de desafío sea significativamente menor al valor de desafío medio del resto de monstruos del encuentro, salvo que pienses que estas criaturas, normalmente débiles, pueden contribuir de forma apreciable a la dificultad del encuentro.</p>
                        <h3>MULTIPLICADORES DE ENCUENTROS</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nº Rivales</th>
                                    <th>Multiplicador</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>1</td><td>1</td></tr>
                                <tr><td>2</td><td>1,5</td></tr>
                                <tr><td>3-6</td><td>2</td></tr>
                                <tr><td>7-10</td><td>2,5</td></tr>
                                <tr><td>11-14</td><td>3</td></tr>
                                <tr><td>15+</td><td>4</td></tr>
                            </tbody>
                        </table>
                    </li>
                    <li><strong>Compara los PX.</strong> Compara el valor en PX ajustado de los monstruos, que acabas de calcular, con los umbrales de PX del grupo. El umbral que coincida con el valor en PX ajustado determinará la dificultad del encuentro. Si ninguno coincide, utiliza el que más se aproxime por debajo.
                        <p>Es decir, que un encuentro compuesto de un osgo y tres hobgoblins, con un valor en PX ajustado de 1.000, será difícil para un grupo formado por tres personajes de nivel 3 y uno de nivel 2, pues su umbral para encuentros difíciles es de 825 PX y su umbral para encuentros mortales es de 1.400 PX.</p>
                    </li>
                </ol>

                <h3>TAMAÑO DEL GRUPO</h3>
                <p>Las directrices que acabas de leer asumen que el grupo está compuesto por entre tres y cinco aventureros.</p>
                <ul>
                    <li>Si está formado por menos de tres personajes, aplica el multiplicador de la fila siguiente en la tabla "multiplicadores de encuentros". Así, deberás emplear un multiplicador de 1,5 cuando un grupo de estas características se enfrente a un monstruo solitario y un multiplicador de 5 para encuentros con quince o más monstruos.</li>
                    <li>Si el grupo se compone de seis personajes o más, haz lo opuesto, utiliza el multiplicador inmediatamente anterior en la tabla. En estos casos, usa un multiplicador de 0,5 si solo hay un monstruo.</li>
                </ul>
            </div>
        </div>
    );
}

export default DifficultyInfoModal;