-- 1. Creación de la base de datos
CREATE DATABASE NexoRaizDB;
GO
USE NexoRaizDB;
GO

-- 2. Tabla de Usuarios (Cumple con los requerimientos de Login y Progreso)
CREATE TABLE Usuarios (
    ID_Usuario INT IDENTITY(1,1) PRIMARY KEY,
    Nombres NVARCHAR(100) NOT NULL,
    Apellidos NVARCHAR(100) NOT NULL,
    Correo NVARCHAR(150) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Rol NVARCHAR(50) DEFAULT 'Usuario', -- Admin, Usuario, Auditor
    Puntos_Idiomas INT DEFAULT 0,
    Nivel_Actual INT DEFAULT 1,
    Fecha_Registro DATETIME DEFAULT GETDATE()
);

-- 3. Tabla de Destinos Turísticos (Para poblar el mapa Leaflet)
CREATE TABLE Destinos (
    ID_Destino INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    Departamento NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    Latitud DECIMAL(10, 6) NOT NULL,
    Longitud DECIMAL(10, 6) NOT NULL,
    ImagenURL NVARCHAR(255)
);

-- 4. Tabla Intermedia de Favoritos (Relación Muchos a Muchos para los "Corazones")
CREATE TABLE Favoritos (
    ID_Favorito INT IDENTITY(1,1) PRIMARY KEY,
    ID_Usuario INT NOT NULL,
    ID_Destino INT NOT NULL,
    Fecha_Agregado DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ID_Usuario) REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (ID_Destino) REFERENCES Destinos(ID_Destino) ON DELETE CASCADE
);

-- 5. Tabla de Vocabulario (Para el módulo de gamificación Miskito/Mayagna)
CREATE TABLE Diccionario (
    ID_Palabra INT IDENTITY(1,1) PRIMARY KEY,
    Idioma NVARCHAR(50) NOT NULL, -- 'Miskito' o 'Mayagna'
    Palabra_Espanol NVARCHAR(100) NOT NULL,
    Traduccion NVARCHAR(100) NOT NULL,
    Nivel_Requerido INT DEFAULT 1
);

-- 6. Tabla de Leyendas (Para el catálogo de tradición oral)
CREATE TABLE Leyendas (
    ID_Leyenda INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(150) NOT NULL,
    Categoria NVARCHAR(50) NOT NULL, -- 'Mito' o 'Leyenda'
    Contenido NVARCHAR(MAX) NOT NULL,
    ImagenURL NVARCHAR(255)
);

-- ==========================================
-- DATOS DE PRUEBA (INSERTs iniciales)
-- ==========================================

-- Insertar Destinos Iniciales

INSERT INTO Destinos (Nombre, Departamento, Descripcion, Latitud, Longitud, ImagenURL) VALUES 
('Isla de Ometepe', 'Rivas', 'Isla formada por dos volcanes en el Lago de Nicaragua. Un destino lleno de naturaleza, cultura y aventura.', 11.5046, -85.5746, 'img/ometepe.jpg'),
('Ciudad de Granada', 'Granada', 'La ciudad colonial más antigua del territorio nicaragüense, famosa por su arquitectura y las Isletas.', 11.9298, -85.9560, 'img/granada.jpg'),
('Volcán Masaya', 'Masaya', 'Uno de los volcanes más activos y accesibles del mundo, donde puedes observar un lago de lava brillante.', 11.9833, -86.1667, 'img/masaya.jpg'),
('Corn Islands', 'RACCS', 'Playas paradisíacas de arena blanca, aguas turquesas y una cultura caribeña única.', 12.1667, -83.0500, 'img/cornisland.jpg'),
('Cañón de Somoto', 'Madriz', 'Impresionante formación rocosa con aguas cristalinas, ideal para nadar y hacer recorridos en bote.', 13.4542, -86.6433, 'img/somoto.jpg'),
('Volcán Cerro Negro', 'León', 'Un volcán joven de arena negra, mundialmente famoso para la práctica de sandboarding.', 12.5064, -86.7023, 'img/cerronegro.jpg'),
('Catedral de León', 'León', 'Patrimonio de la Humanidad y la catedral más grande de Centroamérica, con vistas panorámicas desde su techo.', 12.4352, -86.8797, 'img/catedral_leon.jpg'),
('San Juan del Sur', 'Rivas', 'Bahía turística en el Pacífico, famosa por sus atardeceres, surf y vida nocturna.', 11.2530, -85.8704, 'img/sanjuandelsur.jpg'),
('Selva Negra', 'Matagalpa', 'Reserva natural y hacienda cafetalera en medio del bosque nuboso, perfecta para el ecoturismo.', 12.9996, -85.9085, 'img/selvanegra.jpg'),
('Fortaleza El Castillo', 'Río San Juan', 'Fuerte colonial español construido en el siglo XVII a orillas del majestuoso Río San Juan.', 11.0189, -84.3983, 'img/elcastillo.jpg'),
('Salto de la Estanzuela', 'Estelí', 'Hermosa cascada de 40 metros rodeada de exuberante vegetación y formaciones geológicas.', 13.0238, -86.3533, 'img/estanzuela.jpg'),
('Puerto Salvador Allende', 'Managua', 'Complejo turístico a orillas del Lago Xolotlán que ofrece restaurantes, parques y recorridos en barco.', 12.1585, -86.2758, 'img/salvadorallende.jpg');

-- Insertar Vocabulario Miskito de Prueba
INSERT INTO Diccionario (Idioma, Palabra_Espanol, Traduccion, Nivel_Requerido)
VALUES 
('Miskito', 'Casa', 'Uba', 1),
('Miskito', 'Agua', 'Li', 1),
('Mayagna', 'Sol', 'Maa', 1);

-- Insertar Leyenda de Prueba
INSERT INTO Leyendas (Titulo, Categoria, Contenido, ImagenURL) VALUES 
('La Siguanaba', 'Leyenda', 'Hermosa mujer que aparece bañándose en los ríos a medianoche. Cuando los hombres infieles y trasnochadores se le acercan, muestra su verdadero rostro con cara de caballo.', 'img/siguanaba.jpg'),
('La Carreta Nagua', 'Mito', 'Una carreta fantasmal conducida por la Muerte o esqueletos encapuchados. Pasa a la medianoche haciendo un ruido espantoso de cadenas y ruedas de madera sobre las piedras.', 'img/carretanagua.jpg'),
('La Cegua', 'Leyenda', 'Un espanto con forma de mujer vestida con hojas de maíz y cabello largo. Se dice que castiga a los hombres mujeriegos y borrachos que deambulan solos por la noche.', 'img/cegua.jpg'),
('El Cadejo', 'Mito', 'Dos perros espectrales con ojos de fuego. El Cadejo Blanco es un espíritu protector que acompaña a los caminantes solitarios, mientras que el Cadejo Negro simboliza el mal y ataca a los trasnochadores.', 'img/cadejo.jpg'),
('El Padre sin Cabeza', 'Leyenda', 'El alma en pena de un sacerdote decapitado durante la época colonial que camina por las calles antiguas y cerca de las iglesias buscando su iglesia original para decir misa.', 'img/padresincabeza.jpg'),
('La Mocuana', 'Leyenda', 'El espíritu errante de una princesa indígena que se volvió loca tras ser traicionada por un español. Vaga por las cuevas y caminos oscuros invitando a los hombres a seguirla.', 'img/mocuana.jpg'),
('El Punche de Oro', 'Mito', 'Un cangrejo gigante de oro brillante que sale de las ruinas de León Viejo durante las noches, iluminando las ruinas. Muchos han intentado atraparlo, pero siempre desaparece.', 'img/punche.jpg'),
('La Llorona', 'Leyenda', 'El espectro de una mujer vestida de blanco que vaga llorando desconsoladamente por los ríos y quebradas, buscando eternamente a los hijos que ella misma ahogó.', 'img/llorona.jpg'),
('El Sombrerón', 'Leyenda', 'Un hombre bajito vestido de negro con un gran sombrero que le oculta el rostro. Toca una pequeña guitarra de plata para hechizar y enamorar a las muchachas jóvenes.', 'img/sombreron.jpg'),
('Chico Largo', 'Mito', 'Un ser mágico y dueño de los pactos oscuros que habita en la laguna de Charco Verde, en la Isla de Ometepe. Transforma a quienes hacen pactos con él en animales.', 'img/chicolargo.jpg');
