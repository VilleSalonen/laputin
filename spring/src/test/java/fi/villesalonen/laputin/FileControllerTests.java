package fi.villesalonen.laputin;

import fi.villesalonen.laputin.builders.FileRecordBuilder;
import fi.villesalonen.laputin.builders.FilesQueryBuilder;
import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.records.FileRecord;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public class FileControllerTests {
    @Value("${local.server.port}")
    private int randomServerPort;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    FileRepository fileRepository;
    @Autowired
    TagRepository tagRepository;

    @SuppressWarnings("resource")
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:15.3")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    class QueryByHashAndActive {
        FileRecord activeFile1;
        FileRecord activeFile2;
        FileRecord inactiveFile1;

        @BeforeAll
        public void beforeAll() {
            // Arrange
            fileRepository.deleteAll();
            tagRepository.deleteAll();

            activeFile1 = saveFile(new FileRecordBuilder().build());
            activeFile2 = saveFile(new FileRecordBuilder().build());
            inactiveFile1 = saveFile(new FileRecordBuilder().withActive(false).build());
        }

        @ParameterizedTest
        @MethodSource("queryByHashAndActiveSource")
        public void queryByHashAndActive(String url, List<FileRecord> expected) {
            // Act
            var actual = getFiles(url);

            // Assert
            assertThat(actual)
                .containsExactlyInAnyOrderElementsOf(expected);
        }

        Stream<Arguments> queryByHashAndActiveSource() {
            return Stream.of(
                Arguments.of(
                    new FilesQueryBuilder()
                        .queryByHash(activeFile1, inactiveFile1)
                        .build(),
                    List.of(activeFile1)
                ),

                Arguments.of(
                    new FilesQueryBuilder()
                        .includeInactive()
                        .queryByHash(activeFile1, inactiveFile1)
                        .build(),
                    List.of(activeFile1, inactiveFile1)
                )
            );
        }
    }

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    class QueryByHash {
        FileRecord file1;
        FileRecord file2;
        FileRecord file3;

        @BeforeAll
        public void beforeAll() {
            // Arrange
            fileRepository.deleteAll();
            tagRepository.deleteAll();

            file1 = saveFile(new FileRecordBuilder().build());
            file2 = saveFile(new FileRecordBuilder().build());
            file3 = saveFile(new FileRecordBuilder().build());
        }

        @ParameterizedTest
        @MethodSource("queryByHashSource")
        public void queryByHash(String url, List<FileRecord> expected) {
            // Act
            var actual = getFiles(url);

            // Assert
            assertThat(actual)
                .containsExactlyInAnyOrderElementsOf(expected);
        }

        Stream<Arguments> queryByHashSource() {
            return Stream.of(
                Arguments.of(
                    new FilesQueryBuilder()
                        .queryByHash(file1)
                        .build(),
                    List.of(file1)
                ),

                Arguments.of(
                    new FilesQueryBuilder()
                        .queryByHash(file1, file3)
                        .build(),
                    List.of(file1, file3)
                ),

                Arguments.of(
                    new FilesQueryBuilder()
                        .queryByHash(file1, file2, file3)
                        .build(),
                    List.of(file1, file2, file3)
                )
            );
        }
    }

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    class QueryByActive {
        FileRecord activeFile1;
        FileRecord activeFile2;
        FileRecord inactiveFile1;

        @BeforeAll
        public void beforeAll() {
            // Arrange
            fileRepository.deleteAll();
            tagRepository.deleteAll();

            activeFile1 = saveFile(new FileRecordBuilder().build());
            activeFile2 = saveFile(new FileRecordBuilder().build());
            inactiveFile1 = saveFile(new FileRecordBuilder().withActive(false).build());
        }

        @ParameterizedTest
        @MethodSource("queryByActiveSource")
        public void queryByActive(String url, List<FileRecord> expected) {
            // Act
            var actual = getFiles(url);

            // Assert
            assertThat(actual)
                .containsExactlyInAnyOrderElementsOf(expected);
        }

        Stream<Arguments> queryByActiveSource() {
            return Stream.of(
                Arguments.of(
                    new FilesQueryBuilder().build(),
                    List.of(activeFile1, activeFile2)
                ),

                Arguments.of(
                    new FilesQueryBuilder().includeInactive(false).build(),
                    List.of(activeFile1, activeFile2)
                ),

                Arguments.of(
                    new FilesQueryBuilder().includeInactive(true).build(),
                    List.of(activeFile1, activeFile2, inactiveFile1)
                )
            );
        }
    }

    private FileRecord saveFile(FileRecord file) {
        return FileEntity.toRecord(fileRepository.save(FileEntity.fromRecord(file)));
    }

    private List<FileRecord> getFiles(String url) {
        ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
            "http://localhost:" + randomServerPort + url,
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<>() {}
        );
        return response.getBody();
    }
}
